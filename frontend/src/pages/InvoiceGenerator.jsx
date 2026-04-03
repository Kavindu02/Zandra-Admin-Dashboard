
import React, { useMemo, useState } from 'react';
import { Upload, FileDown, Loader2, RotateCcw, FileText } from 'lucide-react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import mammoth from 'mammoth/mammoth.browser';
import Sidebar from '../components/Sidebar';
import TopHeaderActions from '../components/TopHeaderActions';

const TEMPLATE_PATH = '/template.pdf';

const normalizeKey = (value = '') => value.toLowerCase().replace(/[^a-z0-9]/g, '');
const cleanValue = (value = '') => value.replace(/\s+/g, ' ').trim();
const normalizeBaggageValue = (value = '') => {
  const normalized = cleanValue(value).toUpperCase();
  const baggageMatch = normalized.match(/(?:ADT|CHD|INF)?\s*(\d{1,2})\s*(K|KG)\b/i);
  if (!baggageMatch) {
    return normalized;
  }

  return `${baggageMatch[1]} K`;
};
const MONTH_CODES = new Set([
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
]);
const DATE_ONLY_REGEX = /\b\d{1,2}\s+[A-Z]{3}\s+\d{4}\b/i;
const DATE_TIME_REGEX = /\b\d{1,2}\s+[A-Z]{3}\s+\d{4}\s+\d{1,2}:\d{2}\b/gi;
const FLIGHT_LINE_REGEX = /^([A-Z0-9]{2,3}\s*\d{1,4})\b/i;
const NON_AIRPORT_CODES = new Set(['ADT', 'CHD', 'INF', 'REF', 'HK']);
const TEMPLATE_HEADINGS = [
  /^e-?ticket$/i,
  /^travel details$/i,
  /^ticket data$/i,
  /^coupon no$/i,
  /^segment$/i,
  /^departure$/i,
  /^baggage$/i,
  /^ticket number$/i,
  /^issue date$/i,
  /^issued by/i,
];

const createEmptySegment = (segmentNo) => ({
  segmentNo,
  date: '',
  flightNo: '',
  fromCode: '',
  fromAirport: '',
  fromTerminal: '',
  fromTime: '',
  duration: '',
  toCode: '',
  toAirport: '',
  toTerminal: '',
  toTime: '',
  airline: '',
  bookingClass: '',
  baggage: '',
  fareBasis: '',
  cabinClass: 'Economy',
});

const createDefaultTicketData = () => ({
  passengerName: '',
  travelDetails: '',
  bookingRef: '',
  ticketNumber: '',
  issueDate: '',
  cabinClass: 'Economy',
  segments: [createEmptySegment(1), createEmptySegment(2)],
  coupons: [
    { couponNo: '1', segment: '', departure: '', baggage: '' },
    { couponNo: '2', segment: '', departure: '', baggage: '' },
  ],
});

const PRIMARY_ALIASES = {
  passengerName: ['name', 'passengername', 'travellername', 'passenger'],
  travelDetails: ['traveldetails', 'travelroute', 'route', 'itinerary'],
  bookingRef: ['bookingref', 'bookingreference', 'reservationcode', 'pnr'],
  ticketNumber: ['ticketnumber', 'ticketno', 'eticketnumber'],
  issueDate: ['issuedate', 'dateofissue', 'issuedon'],
  cabinClass: ['class', 'cabinclass', 'travelclass'],
};

const segmentAliases = (segmentNo, field) => {
  const prefix = [`segment${segmentNo}`, `seg${segmentNo}`, `flight${segmentNo}`];
  const map = {
    date: ['date', 'traveldate'],
    flightNo: ['flightno', 'flightnumber', 'number', 'flight'],
    fromCode: ['fromcode', 'origincode'],
    fromAirport: ['fromairport', 'originairport'],
    fromTerminal: ['fromterminal', 'originterminal'],
    fromTime: ['fromtime', 'origintime'],
    duration: ['duration'],
    toCode: ['tocode', 'destinationcode'],
    toAirport: ['toairport', 'destinationairport'],
    toTerminal: ['toterminal', 'destinationterminal'],
    toTime: ['totime', 'destinationtime'],
    airline: ['airline', 'carrier'],
    bookingClass: ['bookingclass', 'bookclass'],
    baggage: ['baggage', 'allowance'],
    fareBasis: ['farebasis', 'farebasiscode'],
    cabinClass: ['class', 'cabinclass', 'travelclass'],
  };

  return map[field].flatMap((suffix) => prefix.map((start) => `${start}${suffix}`));
};

const couponAliases = (couponNo, field) => {
  const prefix = [`coupon${couponNo}`, `cp${couponNo}`];
  const map = {
    segment: ['segment', 'route'],
    departure: ['departure', 'departtime', 'departdatetime'],
    baggage: ['baggage', 'allowance'],
  };

  return map[field].flatMap((suffix) => prefix.map((start) => `${start}${suffix}`));
};

const pickByAliases = (record, aliases) => {
  for (const alias of aliases) {
    const value = record[normalizeKey(alias)];
    if (value) {
      return value;
    }
  }
  return '';
};

const isFilled = (value = '') => Boolean(cleanValue(String(value || '')));

const isHeadingLine = (line = '') => {
  const normalized = cleanValue(line);
  return TEMPLATE_HEADINGS.some((pattern) => pattern.test(normalized));
};

const extractAirportCodes = (value = '') => {
  const matches = [...value.toUpperCase().matchAll(/\b[A-Z]{3}\b/g)].map((match) => match[0]);
  return matches.filter((code) => !MONTH_CODES.has(code));
};

const parseCouponRowFromLine = (line = '') => {
  const compact = cleanValue(line);
  const couponMatch = compact.match(
    /^(\d+)\s+([A-Z]{6})\s+(\d{1,2}\s+[A-Z]{3}\s+\d{4}\s+\d{1,2}:\d{2})\s+((?:ADT|CHD|INF)?\s*[0-9]{1,2}\s*[A-Za-z]{0,3})$/i,
  );

  if (!couponMatch) {
    return null;
  }

  return {
    couponNo: couponMatch[1],
    segment: couponMatch[2].toUpperCase(),
    departure: cleanValue(couponMatch[3].toUpperCase()),
    baggage: normalizeBaggageValue(couponMatch[4]),
  };
};

const parseCouponRowFromCells = (cells = []) => {
  if (cells.length < 4 || !/^\d+$/.test(cells[0])) {
    return null;
  }

  return {
    couponNo: cleanValue(cells[0]),
    segment: cleanValue(cells[1]).toUpperCase(),
    departure: cleanValue(cells[2]).toUpperCase(),
    baggage: normalizeBaggageValue(cells[3]),
  };
};

const mergeSegmentData = (existingSegment, inferredSegment) => {
  const merged = { ...existingSegment };

  Object.keys(existingSegment).forEach((field) => {
    if (field === 'segmentNo' || field === 'cabinClass') {
      return;
    }

    if (!isFilled(merged[field]) && isFilled(inferredSegment[field])) {
      merged[field] = cleanValue(String(inferredSegment[field]));
    }
  });

  if (
    (!isFilled(existingSegment.cabinClass) || cleanValue(existingSegment.cabinClass) === 'Economy') &&
    isFilled(inferredSegment.cabinClass)
  ) {
    merged.cabinClass = cleanValue(String(inferredSegment.cabinClass));
  }

  return merged;
};

const buildTravelDetails = (segments = []) => {
  const path = [];

  segments.forEach((segment, index) => {
    const fromCode = cleanValue(segment.fromCode).toUpperCase();
    const toCode = cleanValue(segment.toCode).toUpperCase();

    if (index === 0 && fromCode) {
      path.push(fromCode);
    }

    if (!path.length && fromCode) {
      path.push(fromCode);
    }

    if (toCode && path[path.length - 1] !== toCode) {
      path.push(toCode);
    }
  });

  return path.join('/');
};

const parseTableRowsFromHtml = (htmlContent = '') => {
  if (!isFilled(htmlContent) || typeof DOMParser === 'undefined') {
    return [];
  }

  const doc = new DOMParser().parseFromString(htmlContent, 'text/html');
  const rows = [];

  doc.querySelectorAll('table tr').forEach((row) => {
    const cells = [...row.querySelectorAll('th, td')]
      .map((cell) => cleanValue(cell.textContent || ''))
      .filter(Boolean);

    if (cells.length) {
      rows.push(cells);
    }
  });

  return rows;
};

const pushUniqueLine = (lineBucket, lineValue) => {
  const normalized = cleanValue(lineValue);
  if (!normalized || lineBucket.includes(normalized)) {
    return;
  }

  lineBucket.push(normalized);
};

const extractTravellerDetails = (lines = []) => {
  const details = {
    bookingRef: '',
    names: [],
  };

  const startIndex = lines.findIndex((line) => /travell?er\s+details/i.test(cleanValue(line)));
  if (startIndex < 0) {
    return details;
  }

  const endIndex = lines.findIndex(
    (line, index) =>
      index > startIndex &&
      (/prepared\s+for/i.test(cleanValue(line)) || /^\d{1,2}\s+[A-Z]{3}\s+\d{4}\b/i.test(cleanValue(line))),
  );

  const scoped = lines
    .slice(startIndex + 1, endIndex > -1 ? endIndex : lines.length)
    .map((line) => cleanValue(line))
    .filter(Boolean);

  scoped.forEach((line) => {
    const bookingMatch = line.match(/Booking\s*Ref\s*:?\s*([A-Z0-9]{4,})/i);
    if (bookingMatch && !details.bookingRef) {
      details.bookingRef = cleanValue(bookingMatch[1].toUpperCase());
      return;
    }

    if (
      /(booking\s*ref|prepared\s*for|email|phone|address)/i.test(line) ||
      /^\+?[0-9\s-]{6,}$/.test(line)
    ) {
      return;
    }

    if (/[A-Z]/i.test(line) && line.split(' ').length >= 2) {
      details.names.push(line);
    }
  });

  return details;
};

const parseSegmentSummaryLine = (line = '') => {
  const compact = cleanValue(line);
  if (!compact) {
    return null;
  }

  const headerMatch = compact.match(/^([A-Z0-9]{2,3}\s*\d{1,4})\s+([A-Z]{3})\s+(.+)$/i);
  if (!headerMatch) {
    return null;
  }

  const segmentData = {
    flightNo: cleanValue(headerMatch[1].toUpperCase()),
    fromCode: cleanValue(headerMatch[2].toUpperCase()),
    fromAirport: '',
    fromTime: '',
    duration: '',
    toCode: '',
    toAirport: '',
    toTime: '',
    fromTerminal: '',
    toTerminal: '',
    cabinClass: '',
    date: '',
  };

  const tail = headerMatch[3];
  const dateTimes = [...tail.matchAll(new RegExp(DATE_TIME_REGEX.source, 'gi'))].map((match) =>
    cleanValue(match[0].toUpperCase()),
  );

  if (dateTimes[0]) {
    segmentData.fromTime = dateTimes[0];
    const dateMatch = dateTimes[0].match(DATE_ONLY_REGEX);
    if (dateMatch) {
      segmentData.date = dateMatch[0].toUpperCase();
    }
  }

  if (dateTimes[1]) {
    segmentData.toTime = dateTimes[1];
  }

  const durationMatch = tail.match(
    /(\d{1,2}\s*hrs?\s*\d{1,2}\s*mins?|\d{1,2}\s*hours?\s*\d{1,2}\s*minutes?)/i,
  );
  if (durationMatch) {
    segmentData.duration = cleanValue(durationMatch[1]);
  }

  const cabinClassMatch = compact.match(/\b(Premium Economy|Economy|Business|First)\b/i);
  if (cabinClassMatch) {
    segmentData.cabinClass = cleanValue(cabinClassMatch[1]);
  }

  const allCodes = extractAirportCodes(compact);
  const routeCodes = allCodes.filter((code, index) => index === 0 || code !== allCodes[index - 1]);
  if (routeCodes.length >= 3) {
    segmentData.toCode = routeCodes[2];
  } else if (routeCodes.length >= 2) {
    segmentData.toCode = routeCodes[1];
  }

  if (segmentData.fromCode && segmentData.toCode) {
    const toCodeIndex = tail.lastIndexOf(segmentData.toCode);
    const fromAirportArea = toCodeIndex > 0 ? tail.slice(0, toCodeIndex) : tail;
    const fromAirportCleaned = cleanValue(
      fromAirportArea
        .replace(new RegExp(`${segmentData.fromCode}\\s*`, 'i'), '')
        .replace(/\d{1,2}\s+[A-Z]{3}\s+\d{4}\s+\d{1,2}:\d{2}.*/i, '')
        .replace(/Duration\s+.*$/i, ''),
    );

    if (fromAirportCleaned) {
      segmentData.fromAirport = fromAirportCleaned;
    }

    if (toCodeIndex > -1) {
      const toTail = tail.slice(toCodeIndex + segmentData.toCode.length);
      const toAirportCleaned = cleanValue(
        toTail
          .replace(/\d{1,2}\s+[A-Z]{3}\s+\d{4}\s+\d{1,2}:\d{2}.*/i, '')
          .replace(/Terminal\s*:\s*[A-Za-z0-9-]+.*/i, ''),
      );

      if (toAirportCleaned) {
        segmentData.toAirport = toAirportCleaned;
      }
    }
  }

  const terminalMatches = [...compact.matchAll(/Terminal\s*:?\s*([A-Za-z0-9-]+)/gi)].map((match) =>
    cleanValue(match[1]),
  );

  if (terminalMatches.length > 1) {
    segmentData.fromTerminal = `Terminal: ${terminalMatches[0]}`;
    segmentData.toTerminal = `Terminal: ${terminalMatches[terminalMatches.length - 1]}`;
  } else if (terminalMatches.length === 1) {
    segmentData.toTerminal = `Terminal: ${terminalMatches[0]}`;
  }

  return segmentData;
};

const parseSegmentBlockFromLines = (lines, startIndex, endIndex, segmentNo, fallbackClass) => {
  const segment = createEmptySegment(segmentNo);
  segment.cabinClass = fallbackClass || 'Economy';

  const blockLines = lines.slice(startIndex, endIndex).map((line) => cleanValue(line)).filter(Boolean);
  if (!blockLines.length) {
    return segment;
  }

  const flightMatch = blockLines[0].match(FLIGHT_LINE_REGEX);
  if (flightMatch) {
    segment.flightNo = cleanValue(flightMatch[1].toUpperCase());
  }

  const summarySegment = parseSegmentSummaryLine(blockLines[0]);
  if (summarySegment) {
    Object.entries(summarySegment).forEach(([field, value]) => {
      if (!Object.prototype.hasOwnProperty.call(segment, field)) {
        return;
      }

      if (isFilled(value)) {
        segment[field] = cleanValue(String(value));
      }
    });
  }

  const headerCodes = extractAirportCodes(blockLines[0]);
  if (headerCodes.length >= 2) {
    segment.fromCode = headerCodes[0];
    segment.toCode = headerCodes[headerCodes.length - 1];
  }

  const routeCodeSequence = [];
  const pushRouteCode = (code) => {
    const normalizedCode = cleanValue(code).toUpperCase();
    if (
      !normalizedCode ||
      MONTH_CODES.has(normalizedCode) ||
      NON_AIRPORT_CODES.has(normalizedCode) ||
      routeCodeSequence.includes(normalizedCode)
    ) {
      return;
    }

    routeCodeSequence.push(normalizedCode);
  };

  const codeOnlyIndexes = [];

  blockLines.forEach((line, idx) => {
    const codeOnlyMatch = line.match(/^([A-Z]{3})$/i);
    if (codeOnlyMatch) {
      const normalizedCode = codeOnlyMatch[1].toUpperCase();
      if (!MONTH_CODES.has(normalizedCode) && !NON_AIRPORT_CODES.has(normalizedCode)) {
        codeOnlyIndexes.push({ idx, code: normalizedCode });
        pushRouteCode(normalizedCode);
      }
    }

    extractAirportCodes(line).forEach((code) => pushRouteCode(code));
  });

  if (!isFilled(segment.fromCode) && routeCodeSequence[0]) {
    segment.fromCode = routeCodeSequence[0];
  }

  if (!isFilled(segment.toCode)) {
    const destinationCode = routeCodeSequence.find((code) => code !== segment.fromCode);
    if (destinationCode) {
      segment.toCode = destinationCode;
    }
  }

  const readAirportTextAfterCode = (codeIndex) => {
    const textParts = [];

    for (let i = codeIndex + 1; i < blockLines.length; i += 1) {
      const candidate = blockLines[i];

      if (
        /^([A-Z]{3})$/i.test(candidate) ||
        FLIGHT_LINE_REGEX.test(candidate) ||
        /^(duration|terminal|airline|equipment|status|baggage|fare basis|airline ref)/i.test(candidate) ||
        DATE_ONLY_REGEX.test(candidate)
      ) {
        break;
      }

      if (!DATE_TIME_REGEX.test(candidate)) {
        textParts.push(candidate);
      }

      if (textParts.length >= 2) {
        break;
      }
    }

    return cleanValue(textParts.join(', '));
  };

  if (!isFilled(segment.fromAirport) && codeOnlyIndexes[0]) {
    const airportText = readAirportTextAfterCode(codeOnlyIndexes[0].idx);
    if (airportText) {
      segment.fromAirport = airportText;
    }
  }

  if (!isFilled(segment.toAirport) && codeOnlyIndexes[1]) {
    const airportText = readAirportTextAfterCode(codeOnlyIndexes[1].idx);
    if (airportText) {
      segment.toAirport = airportText;
    }
  }

  const headerDurationMatch = blockLines[0].match(
    /(\d{1,2}\s*hrs?\s*\d{1,2}\s*mins?|\d{1,2}\s*hours?\s*\d{1,2}\s*minutes?)/i,
  );
  if (headerDurationMatch) {
    segment.duration = cleanValue(headerDurationMatch[1]);
  }

  const headerClassMatch = blockLines[0].match(/\b(Premium Economy|Economy|Business|First)\b/i);
  if (headerClassMatch) {
    segment.cabinClass = cleanValue(headerClassMatch[1]);
  }

  for (let cursor = startIndex - 1; cursor >= Math.max(0, startIndex - 5); cursor -= 1) {
    const previousLine = cleanValue(lines[cursor]);
    if (!previousLine) {
      continue;
    }

    if (!isFilled(segment.date)) {
      const dateMatch = previousLine.toUpperCase().match(DATE_ONLY_REGEX);
      if (dateMatch) {
        segment.date = dateMatch[0].toUpperCase();
      }
    }

    if (!isFilled(segment.cabinClass) || segment.cabinClass === 'Economy') {
      const classMatch = previousLine.match(/\b(Premium Economy|Economy|Business|First)\b/i);
      if (classMatch) {
        segment.cabinClass = cleanValue(classMatch[1]);
      }
    }
  }

  const blockText = blockLines.join('\n');
  const durationMatch = blockText.match(
    /(\d{1,2}\s*hrs?\s*\d{1,2}\s*mins?|\d{1,2}\s*hours?\s*\d{1,2}\s*minutes?)/i,
  );
  if (durationMatch) {
    segment.duration = cleanValue(durationMatch[1]);
  }

  const dateTimeMatches = [...blockText.matchAll(new RegExp(DATE_TIME_REGEX.source, 'gi'))].map((match) =>
    cleanValue(match[0].toUpperCase()),
  );

  if (dateTimeMatches[0]) {
    segment.fromTime = dateTimeMatches[0];
  }

  if (dateTimeMatches[1]) {
    segment.toTime = dateTimeMatches[1];
  }

  if (!isFilled(segment.date) && dateTimeMatches[0]) {
    const dateFromTime = dateTimeMatches[0].match(DATE_ONLY_REGEX);
    if (dateFromTime) {
      segment.date = dateFromTime[0].toUpperCase();
    }
  }

  const terminals = [];
  const airportCandidates = [];

  for (const line of blockLines) {
    if (!isFilled(segment.fromCode) || !isFilled(segment.toCode)) {
      const codes = extractAirportCodes(line);
      if (codes.length >= 2) {
        segment.fromCode = codes[0];
        segment.toCode = codes[codes.length - 1];
      }
    }

    const airlineFieldMatch = line.match(/^Airline(?:\s*Name)?\s*:?\s*(.+)$/i);
    if (airlineFieldMatch && !/Airline\s*Ref/i.test(line)) {
      segment.airline = cleanValue(airlineFieldMatch[1]);
    } else if (
      !isFilled(segment.airline) &&
      /(airline|airways|carrier)/i.test(line) &&
      !/(airline\s*ref|fare basis|status|baggage|terminal)/i.test(line)
    ) {
      segment.airline = cleanValue(line);
    }

    const bookingClassMatch = line.match(/Status\s*:?\s*([A-Z0-9]{1,5})/i);
    if (bookingClassMatch) {
      segment.bookingClass = cleanValue(bookingClassMatch[1].toUpperCase());
    }

    const baggageFromStatus = line.match(/\b(?:ADT\s*)?(\d{1,2}\s*(?:K|KG))\b/i);
    if (!isFilled(segment.baggage) && baggageFromStatus) {
      segment.baggage = normalizeBaggageValue(baggageFromStatus[1]);
    }

    const baggageMatch = line.match(/Baggage\s*:?\s*([0-9]{1,2}\s*[A-Za-z]{0,3})/i);
    if (baggageMatch) {
      segment.baggage = normalizeBaggageValue(baggageMatch[1]);
    }

    const fareBasisMatch = line.match(/Fare\s*Basis\s*:?\s*([A-Z0-9]+)/i);
    if (fareBasisMatch) {
      segment.fareBasis = cleanValue(fareBasisMatch[1].toUpperCase());
    }

    [...line.matchAll(/Terminal\s*:?\s*([A-Za-z0-9-]+)/gi)].forEach((match) => {
      terminals.push(`Terminal: ${cleanValue(match[1])}`);
    });

    if (
      /(airport|arpt|international|,)/i.test(line) &&
      !/(airline\s*ref|fare basis|status|baggage|terminal|duration)/i.test(line)
    ) {
      const codedAirportMatch = line.match(/^([A-Z]{3})\s+(.+)$/);
      airportCandidates.push(cleanValue(codedAirportMatch ? codedAirportMatch[2] : line));
    }
  }

  if (terminals[0]) {
    segment.fromTerminal = terminals[0];
  }

  if (terminals[1]) {
    segment.toTerminal = terminals[1];
  }

  if (airportCandidates[0]) {
    segment.fromAirport = airportCandidates[0];
  }

  if (airportCandidates[1]) {
    segment.toAirport = airportCandidates[1];
  }

  return segment;
};

const parseWordTicketData = (rawText, htmlContent = '') => {
  const record = {};
  const couponRowsFromTable = [];
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const tableRows = parseTableRowsFromHtml(htmlContent);
  if (isFilled(htmlContent) && typeof DOMParser !== 'undefined') {
    const htmlDoc = new DOMParser().parseFromString(htmlContent, 'text/html');
    const htmlLines = (htmlDoc.body?.textContent || '')
      .split(/\r?\n/)
      .map((line) => cleanValue(line))
      .filter(Boolean);

    htmlLines.forEach((line) => pushUniqueLine(lines, line));
  }

  tableRows.forEach((cells) => {
    const couponFromCells = parseCouponRowFromCells(cells);
    if (couponFromCells) {
      couponRowsFromTable.push(couponFromCells);
    }

    if (cells.length === 2) {
      record[normalizeKey(cells[0])] = cleanValue(cells[1]);
    }

    pushUniqueLine(lines, cells.join(' '));
  });

  for (let idx = 0; idx < tableRows.length - 1; idx += 1) {
    const headerCells = tableRows[idx];
    const valueCells = tableRows[idx + 1];

    if (
      headerCells.length >= 2 &&
      valueCells.length >= 2 &&
      /ticket\s*number/i.test(headerCells[0]) &&
      /issue\s*date/i.test(headerCells[1])
    ) {
      record.ticketnumber = record.ticketnumber || cleanValue(valueCells[0]);
      record.issuedate = record.issuedate || cleanValue(valueCells[1].toUpperCase());
    }
  }

  for (const line of lines) {
    const pairWithColon = line.match(/^([^:]{2,70})\s*:\s*(.+)$/);
    if (pairWithColon) {
      record[normalizeKey(pairWithColon[1])] = cleanValue(pairWithColon[2]);
      continue;
    }

    const tabCells = line
      .split(/\t+/)
      .map((cell) => cell.trim())
      .filter(Boolean);

    if (tabCells.length === 2) {
      record[normalizeKey(tabCells[0])] = cleanValue(tabCells[1]);
      continue;
    }

    if (tabCells.length >= 4 && /^\d+$/.test(tabCells[0])) {
      couponRowsFromTable.push({
        couponNo: tabCells[0],
        segment: cleanValue(tabCells[1]).toUpperCase(),
        departure: cleanValue(tabCells[2]).toUpperCase(),
        baggage: normalizeBaggageValue(tabCells[3]),
      });
      continue;
    }

    const inlineTicketIssueMatch = line.match(
      /^([0-9]{10,})\s+((?:\d{4}-\d{2}-\d{2})|(?:\d{1,2}\s+[A-Z]{3}\s+\d{4}))$/i,
    );
    if (inlineTicketIssueMatch) {
      record.ticketnumber = cleanValue(inlineTicketIssueMatch[1]);
      record.issuedate = cleanValue(inlineTicketIssueMatch[2].toUpperCase());
    }

    const inlineBookingRefMatch = line.match(/^Booking\s*Ref(?:erence)?\s*:?\s*([A-Z0-9]{4,})$/i);
    if (inlineBookingRefMatch) {
      record.bookingref = cleanValue(inlineBookingRefMatch[1].toUpperCase());
    }

    const couponFromLine = parseCouponRowFromLine(line);
    if (couponFromLine) {
      couponRowsFromTable.push(couponFromLine);
    }
  }

  const ticketData = createDefaultTicketData();
  const mergedText = lines.join('\n');
  const travellerDetails = extractTravellerDetails(lines);

  ticketData.passengerName = pickByAliases(record, PRIMARY_ALIASES.passengerName);
  ticketData.travelDetails = pickByAliases(record, PRIMARY_ALIASES.travelDetails);
  ticketData.bookingRef = pickByAliases(record, PRIMARY_ALIASES.bookingRef);
  ticketData.ticketNumber = pickByAliases(record, PRIMARY_ALIASES.ticketNumber);
  ticketData.issueDate = pickByAliases(record, PRIMARY_ALIASES.issueDate);
  ticketData.cabinClass = pickByAliases(record, PRIMARY_ALIASES.cabinClass) || 'Economy';

  if (!isFilled(ticketData.bookingRef) && isFilled(travellerDetails.bookingRef)) {
    ticketData.bookingRef = travellerDetails.bookingRef;
  }

  if (!isFilled(ticketData.passengerName) && travellerDetails.names.length) {
    ticketData.passengerName = cleanValue(travellerDetails.names[0]);
  }

  if (!isFilled(ticketData.passengerName)) {
    const inlineNameLine = lines.find((line) => /^e-?ticket\s+.+$/i.test(cleanValue(line)));
    if (inlineNameLine) {
      ticketData.passengerName = cleanValue(inlineNameLine.replace(/^e-?ticket\s*/i, ''));
    }
  }

  if (!isFilled(ticketData.bookingRef)) {
    const bookingRefMatch = mergedText.match(/Booking\s*Ref(?:erence)?\s*:?\s*([A-Z0-9]{4,})/i);
    if (bookingRefMatch) {
      ticketData.bookingRef = cleanValue(bookingRefMatch[1].toUpperCase());
    }
  }

  if (!isFilled(ticketData.ticketNumber)) {
    const ticketNumberMatch = mergedText.match(/Ticket\s*Number\s*:?\s*([0-9]{10,})/i);
    if (ticketNumberMatch) {
      ticketData.ticketNumber = cleanValue(ticketNumberMatch[1]);
    }
  }

  if (!isFilled(ticketData.issueDate)) {
    const issueDateMatch = mergedText.match(
      /Issue\s*Date\s*:?\s*((?:\d{4}-\d{2}-\d{2})|(?:\d{1,2}\s+[A-Z]{3}\s+\d{4}))/i,
    );

    if (issueDateMatch) {
      ticketData.issueDate = cleanValue(issueDateMatch[1].toUpperCase());
    } else {
      const fallbackDateMatch = mergedText.match(/\b\d{4}-\d{2}-\d{2}\b/);
      if (fallbackDateMatch) {
        ticketData.issueDate = fallbackDateMatch[0];
      }
    }
  }

  if (!isFilled(ticketData.passengerName)) {
    const eTicketIndex = lines.findIndex((line) => /^e-?ticket$/i.test(cleanValue(line)));
    if (eTicketIndex >= 0) {
      const guessedName = lines.slice(eTicketIndex + 1).find((line) => {
        const normalized = cleanValue(line);
        return (
          isFilled(normalized) &&
          !isHeadingLine(normalized) &&
          !/(booking\s*ref|ticket\s*number|issue\s*date)/i.test(normalized)
        );
      });

      if (guessedName) {
        ticketData.passengerName = cleanValue(guessedName);
      }
    }
  }

  if (!isFilled(ticketData.cabinClass) || ticketData.cabinClass === 'Economy') {
    const cabinClassMatch = mergedText.match(/\b(Premium Economy|Economy|Business|First)\b/i);
    if (cabinClassMatch) {
      ticketData.cabinClass = cleanValue(cabinClassMatch[1]);
    }
  }

  ticketData.segments = [1, 2].map((segmentNo) => ({
    segmentNo,
    date: pickByAliases(record, segmentAliases(segmentNo, 'date')),
    flightNo: pickByAliases(record, segmentAliases(segmentNo, 'flightNo')),
    fromCode: pickByAliases(record, segmentAliases(segmentNo, 'fromCode')),
    fromAirport: pickByAliases(record, segmentAliases(segmentNo, 'fromAirport')),
    fromTerminal: pickByAliases(record, segmentAliases(segmentNo, 'fromTerminal')),
    fromTime: pickByAliases(record, segmentAliases(segmentNo, 'fromTime')),
    duration: pickByAliases(record, segmentAliases(segmentNo, 'duration')),
    toCode: pickByAliases(record, segmentAliases(segmentNo, 'toCode')),
    toAirport: pickByAliases(record, segmentAliases(segmentNo, 'toAirport')),
    toTerminal: pickByAliases(record, segmentAliases(segmentNo, 'toTerminal')),
    toTime: pickByAliases(record, segmentAliases(segmentNo, 'toTime')),
    airline: pickByAliases(record, segmentAliases(segmentNo, 'airline')),
    bookingClass: pickByAliases(record, segmentAliases(segmentNo, 'bookingClass')),
    baggage: pickByAliases(record, segmentAliases(segmentNo, 'baggage')),
    fareBasis: pickByAliases(record, segmentAliases(segmentNo, 'fareBasis')),
    cabinClass:
      pickByAliases(record, segmentAliases(segmentNo, 'cabinClass')) ||
      pickByAliases(record, PRIMARY_ALIASES.cabinClass) ||
      'Economy',
  }));

  const flightStartIndexes = lines
    .map((line, index) => ({ line: cleanValue(line), index }))
    .filter(
      ({ line }) =>
        FLIGHT_LINE_REGEX.test(line) && !/(coupon|ticket\s*number|booking\s*ref|issue\s*date)/i.test(line),
    )
    .map(({ index }) => index);

  flightStartIndexes.slice(0, 2).forEach((startIndex, index) => {
    const endIndex = flightStartIndexes[index + 1] ?? lines.length;
    const inferredSegment = parseSegmentBlockFromLines(
      lines,
      startIndex,
      endIndex,
      index + 1,
      ticketData.cabinClass,
    );

    ticketData.segments[index] = mergeSegmentData(ticketData.segments[index], inferredSegment);
  });

  ticketData.coupons = [1, 2].map((couponNo) => ({
    couponNo: String(couponNo),
    segment: pickByAliases(record, couponAliases(couponNo, 'segment')),
    departure: pickByAliases(record, couponAliases(couponNo, 'departure')),
    baggage: pickByAliases(record, couponAliases(couponNo, 'baggage')),
  }));

  couponRowsFromTable.forEach((row, index) => {
    if (index < ticketData.coupons.length) {
      ticketData.coupons[index] = {
        couponNo: row.couponNo || String(index + 1),
        segment: row.segment || '',
        departure: row.departure || '',
        baggage: row.baggage || '',
      };
    }
  });

  ticketData.coupons = ticketData.coupons.map((coupon, index) => {
    const normalizedCoupon = { ...coupon };
    const segment = ticketData.segments[index] || createEmptySegment(index + 1);

    if (!isFilled(normalizedCoupon.segment) && isFilled(segment.fromCode) && isFilled(segment.toCode)) {
      normalizedCoupon.segment = `${segment.fromCode.toUpperCase()}${segment.toCode.toUpperCase()}`;
    }

    if (!isFilled(normalizedCoupon.departure) && isFilled(segment.fromTime)) {
      normalizedCoupon.departure = cleanValue(segment.fromTime.toUpperCase());
    }

    if (!isFilled(normalizedCoupon.baggage) && isFilled(segment.baggage)) {
      normalizedCoupon.baggage = normalizeBaggageValue(segment.baggage);
    }

    return normalizedCoupon;
  });

  ticketData.segments = ticketData.segments.map((segment, index) => {
    const normalizedSegment = { ...segment };
    const coupon = ticketData.coupons[index] || {};

    if (isFilled(coupon.segment) && (!isFilled(normalizedSegment.fromCode) || !isFilled(normalizedSegment.toCode))) {
      const routeMatch = cleanValue(coupon.segment).toUpperCase().match(/^([A-Z]{3})([A-Z]{3})$/);
      if (routeMatch) {
        if (!isFilled(normalizedSegment.fromCode)) {
          normalizedSegment.fromCode = routeMatch[1];
        }
        if (!isFilled(normalizedSegment.toCode)) {
          normalizedSegment.toCode = routeMatch[2];
        }
      }
    }

    if (!isFilled(normalizedSegment.fromTime) && isFilled(coupon.departure)) {
      normalizedSegment.fromTime = cleanValue(coupon.departure.toUpperCase());
    }

    if (!isFilled(normalizedSegment.baggage) && isFilled(coupon.baggage)) {
      normalizedSegment.baggage = cleanValue(coupon.baggage.toUpperCase()).replace(/\s*K$/i, 'KG');
    }

    if (!isFilled(normalizedSegment.date) && isFilled(normalizedSegment.fromTime)) {
      const dateMatch = normalizedSegment.fromTime.toUpperCase().match(DATE_ONLY_REGEX);
      if (dateMatch) {
        normalizedSegment.date = dateMatch[0].toUpperCase();
      }
    }

    return normalizedSegment;
  });

  if (!ticketData.travelDetails) {
    ticketData.travelDetails = buildTravelDetails(ticketData.segments);
  }

  if (!isFilled(ticketData.travelDetails)) {
    const couponRouteCodes = ticketData.coupons
      .map((coupon) => cleanValue(coupon.segment).toUpperCase())
      .map((segmentCode) => segmentCode.match(/^([A-Z]{3})([A-Z]{3})$/))
      .filter(Boolean);

    if (couponRouteCodes.length) {
      const routeParts = [couponRouteCodes[0][1]];
      couponRouteCodes.forEach((match) => {
        const destination = match[2];
        if (routeParts[routeParts.length - 1] !== destination) {
          routeParts.push(destination);
        }
      });
      ticketData.travelDetails = routeParts.join('/');
    }
  }

  if (!isFilled(ticketData.issueDate) && isFilled(ticketData.segments[0]?.date)) {
    ticketData.issueDate = cleanValue(ticketData.segments[0].date.toUpperCase());
  }

  return ticketData;
};

const drawLine = (page, font, value, x, y, size = 8, boldFont = null, maxLength = 100) => {
  const printable = cleanValue(String(value || '')).slice(0, maxLength);
  if (!printable) {
    return;
  }

  page.drawText(printable, {
    x,
    y,
    size,
    font: boldFont || font,
    color: rgb(0.06, 0.09, 0.15),
  });
};

const drawSegmentBlock = (page, segment, yTop, regularFont, boldFont, passengerName, fallbackClass) => {
  drawLine(page, regularFont, segment.date, 34, yTop, 7.5, boldFont, 20);
  drawLine(page, regularFont, segment.cabinClass || fallbackClass || 'Economy', 483, yTop, 7.5, boldFont, 20);

  drawLine(page, regularFont, segment.flightNo, 34, yTop - 22, 8, boldFont, 20);
  drawLine(page, regularFont, segment.fromCode, 120, yTop - 22, 16, boldFont, 8);
  drawLine(page, regularFont, segment.duration, 272, yTop - 21, 7, null, 30);
  drawLine(page, regularFont, segment.toCode, 404, yTop - 22, 16, boldFont, 8);

  drawLine(page, regularFont, segment.fromAirport, 120, yTop - 34, 5.4, null, 56);
  drawLine(page, regularFont, segment.fromTerminal, 120, yTop - 41, 5.4, null, 36);
  drawLine(page, regularFont, segment.fromTime, 120, yTop - 48, 5.4, null, 24);

  drawLine(page, regularFont, segment.toAirport, 404, yTop - 34, 5.4, null, 56);
  drawLine(page, regularFont, segment.toTerminal, 404, yTop - 41, 5.4, null, 36);
  drawLine(page, regularFont, segment.toTime, 404, yTop - 48, 5.4, null, 24);

  drawLine(page, regularFont, segment.airline, 34, yTop - 60, 5.6, null, 32);
  drawLine(page, regularFont, passengerName, 34, yTop - 67, 5.6, null, 44);
  drawLine(page, regularFont, segment.bookingClass, 119, yTop - 67, 5.6, null, 14);
  drawLine(page, regularFont, segment.baggage, 206, yTop - 67, 5.6, null, 20);
  drawLine(page, regularFont, segment.fareBasis, 292, yTop - 67, 5.6, null, 28);
};

const generateTicketPdf = async (ticketData) => {
  const response = await fetch(TEMPLATE_PATH);
  if (!response.ok) {
    throw new Error('Template PDF not found in public folder.');
  }

  const templateBytes = await response.arrayBuffer();
  const pdfDoc = await PDFDocument.load(templateBytes);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  if (!pages.length) {
    throw new Error('Template PDF has no pages.');
  }

  const pageOne = pages[0];
  drawLine(pageOne, regularFont, ticketData.passengerName, 34, 691, 10, boldFont, 55);
  drawLine(pageOne, regularFont, ticketData.travelDetails, 34, 656, 8, null, 64);
  drawLine(pageOne, regularFont, ticketData.bookingRef, 92, 632, 8, null, 24);
  drawLine(pageOne, regularFont, ticketData.ticketNumber, 34, 607, 8, null, 28);
  drawLine(pageOne, regularFont, ticketData.issueDate, 450, 607, 8, null, 24);

  drawSegmentBlock(
    pageOne,
    ticketData.segments[0] || createEmptySegment(1),
    573,
    regularFont,
    boldFont,
    ticketData.passengerName,
    ticketData.cabinClass,
  );

  drawSegmentBlock(
    pageOne,
    ticketData.segments[1] || createEmptySegment(2),
    483,
    regularFont,
    boldFont,
    ticketData.passengerName,
    ticketData.cabinClass,
  );

  const pageTwo = pages[1] || pageOne;
  const couponStartY = pages[1] ? 706 : 228;
  const rowGap = 23;

  ticketData.coupons.forEach((coupon, index) => {
    const y = couponStartY - index * rowGap;
    drawLine(pageTwo, regularFont, coupon.couponNo || String(index + 1), 36, y, 7, null, 4);
    drawLine(pageTwo, regularFont, coupon.segment, 118, y, 7, null, 30);
    drawLine(pageTwo, regularFont, coupon.departure, 246, y, 7, null, 36);
    drawLine(pageTwo, regularFont, coupon.baggage, 413, y, 7, null, 12);
  });

  return pdfDoc.save();
};

const downloadPdf = (bytes, fileName) => {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

export default function InvoiceGenerator() {
  const [ticketData, setTicketData] = useState(createDefaultTicketData());
  const [sourceFileName, setSourceFileName] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState({
    type: 'info',
    message:
      'Upload the airline e-ticket .docx file. Details are auto-detected and mapped into public/template.pdf.',
  });

  const isReadyToGenerate = useMemo(() => {
    return Boolean(
      ticketData.passengerName ||
        ticketData.bookingRef ||
        ticketData.ticketNumber ||
        ticketData.segments.some((segment) => segment.flightNo || segment.fromCode || segment.toCode),
    );
  }, [ticketData]);

  const handleWordUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith('.docx')) {
      setStatus({ type: 'error', message: 'Please upload a .docx Word file.' });
      return;
    }

    setIsParsing(true);
    setStatus({ type: 'info', message: 'Reading the Word file and mapping ticket details...' });

    try {
      const arrayBuffer = await file.arrayBuffer();
      const [textResult, htmlResult] = await Promise.all([
        mammoth.extractRawText({ arrayBuffer }),
        mammoth.convertToHtml({ arrayBuffer }),
      ]);
      const parsedData = parseWordTicketData(textResult.value || '', htmlResult.value || '');

      setTicketData(parsedData);
      setSourceFileName(file.name);
      setStatus({
        type: 'success',
        message:
          'Word file parsed successfully. Review the extracted values below and click Generate PDF.',
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: `Failed to read Word file: ${error.message || 'Unknown parsing error.'}`,
      });
    } finally {
      setIsParsing(false);
      event.target.value = '';
    }
  };

  const handleReset = () => {
    setTicketData(createDefaultTicketData());
    setSourceFileName('');
    setStatus({
      type: 'info',
      message:
        'State reset. Upload another .docx file and generate a new PDF from the template.',
    });
  };

  const handleGeneratePdf = async () => {
    if (!isReadyToGenerate) {
      setStatus({
        type: 'error',
        message: 'No ticket data found. Upload a Word file first.',
      });
      return;
    }

    setIsGenerating(true);
    setStatus({ type: 'info', message: 'Generating PDF from template...' });

    try {
      const bytes = await generateTicketPdf(ticketData);
      downloadPdf(bytes, `zandra-ticket-${Date.now()}.pdf`);
      setStatus({
        type: 'success',
        message: 'PDF generated successfully from template.pdf and downloaded.',
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: `PDF generation failed: ${error.message || 'Unknown error.'}`,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const statusClasses = {
    info: 'bg-blue-50 text-blue-700 border-blue-100',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    error: 'bg-red-50 text-red-700 border-red-100',
  };

  return (
    <div className="flex min-h-screen bg-[#E5E7EB]">
      <Sidebar />
      <div className="flex-1 ml-64">
        <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8">
          <h2 className="font-bold text-gray-800">PDF Generator</h2>
          <TopHeaderActions />
        </div>
        <div className="p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="font-bold text-2xl text-gray-900 mb-2">PDF Generator</h3>
              <p className="text-gray-500 mb-6">
                Upload your Word e-ticket document and generate an auto-filled PDF from the template.
              </p>

              <label className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#F3A91B] transition-colors">
                <Upload className="w-7 h-7 text-[#101D42] mb-3" />
                <span className="font-semibold text-gray-700">Upload Word File (.docx)</span>
                <span className="text-xs text-gray-500 mt-1">
                  Supports airline e-ticket layout with Booking Ref, Ticket Number, flight segments, and coupon rows.
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleWordUpload}
                />
              </label>

              <div className={`mt-5 border rounded-xl px-4 py-3 text-sm ${statusClasses[status.type]}`}>
                {status.message}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={handleGeneratePdf}
                  disabled={isGenerating || isParsing || !isReadyToGenerate}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#101D42] text-white px-5 py-2.5 font-semibold disabled:opacity-60 disabled:cursor-not-allowed hover:bg-[#182b60] transition-colors"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                  Generate PDF
                </button>

                <button
                  onClick={handleReset}
                  disabled={isGenerating || isParsing}
                  className="inline-flex items-center gap-2 rounded-xl bg-gray-100 text-gray-700 px-5 py-2.5 font-semibold disabled:opacity-60 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                >
                  {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                  Reset
                </button>

                {sourceFileName && (
                  <div className="inline-flex items-center gap-2 text-sm text-gray-600 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
                    <FileText className="w-4 h-4" />
                    {sourceFileName}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h4 className="font-bold text-lg text-gray-900 mb-4">Extracted Ticket Details</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                  <p className="text-gray-500">Passenger Name</p>
                  <p className="font-semibold text-gray-800">{ticketData.passengerName || '-'}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                  <p className="text-gray-500">Travel Details</p>
                  <p className="font-semibold text-gray-800">{ticketData.travelDetails || '-'}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                  <p className="text-gray-500">Booking Ref</p>
                  <p className="font-semibold text-gray-800">{ticketData.bookingRef || '-'}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                  <p className="text-gray-500">Ticket Number</p>
                  <p className="font-semibold text-gray-800">{ticketData.ticketNumber || '-'}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {ticketData.segments.map((segment) => (
                  <div key={segment.segmentNo} className="rounded-xl border border-gray-100 p-4 bg-[#FAFAFA]">
                    <p className="font-semibold text-gray-800 mb-3">Segment {segment.segmentNo}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>Date: {segment.date || '-'}</div>
                      <div>Flight: {segment.flightNo || '-'}</div>
                      <div>From: {segment.fromCode || '-'}</div>
                      <div>To: {segment.toCode || '-'}</div>
                      <div>From Time: {segment.fromTime || '-'}</div>
                      <div>To Time: {segment.toTime || '-'}</div>
                      <div>Duration: {segment.duration || '-'}</div>
                      <div>Baggage: {segment.baggage || '-'}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full text-sm border border-gray-100 rounded-xl overflow-hidden">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left px-4 py-2">Coupon</th>
                      <th className="text-left px-4 py-2">Segment</th>
                      <th className="text-left px-4 py-2">Departure</th>
                      <th className="text-left px-4 py-2">Baggage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ticketData.coupons.map((coupon, index) => (
                      <tr key={index} className="border-t border-gray-100 text-gray-700">
                        <td className="px-4 py-2">{coupon.couponNo || String(index + 1)}</td>
                        <td className="px-4 py-2">{coupon.segment || '-'}</td>
                        <td className="px-4 py-2">{coupon.departure || '-'}</td>
                        <td className="px-4 py-2">{coupon.baggage || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}