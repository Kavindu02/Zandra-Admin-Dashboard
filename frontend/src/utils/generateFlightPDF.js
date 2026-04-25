import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Shared PDF generator for flight e-tickets.
 * Used by both CustomersFlights and IssueTicket pages.
 */
export const generateFlightPDF = async (customer) => {
  const existingPdfBytes = await fetch('/template.pdf').then(res => res.arrayBuffer());
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  let page = pdfDoc.getPages()[0];

  // Neutral gray palette
  const yellowHeader = rgb(0.93, 0.94, 0.95);
  const yellowAccent = rgb(0.88, 0.89, 0.91);
  const warmBorder = rgb(0.76, 0.79, 0.84);

  const valueOrDash = (value) => {
    const text = String(value ?? '').trim();
    return text || '-';
  };

  const clampMeta = (value, max = 24) => {
    const text = valueOrDash(value);
    return text.length > max ? `${text.slice(0, max - 3)}...` : text;
  };

  const formatPDFDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch (e) { return dateStr; }
  };

  const parseAirport = (str) => {
    if (!str) return { code: '', rest: '' };
    const parts = str.split(' ');
    if (parts.length > 1 && parts[0].length === 3 && parts[0] === parts[0].toUpperCase()) {
      return { code: parts[0], rest: parts.slice(1).join(' ') };
    }
    return { code: str.substring(0, 3).toUpperCase(), rest: str };
  };

  // --- Header section ---
  page.drawText('E-Ticket', { x: 30, y: 640, size: 22, font, color: rgb(0, 0, 0) });
  const paxName = (customer.passenger || '').toUpperCase();
  page.drawText(paxName, { x: 30, y: 618, size: 14, font, color: rgb(0.18, 0.31, 0.45) });

  page.drawRectangle({ x: 30, y: 575, width: 320, height: 26, color: yellowHeader, borderColor: warmBorder, borderWidth: 0.8 });
  page.drawText('Travel Details', { x: 42, y: 583, size: 10, font: fontBold, color: rgb(0.18, 0.28, 0.38) });

  const bookingRefText = `Booking Ref: ${customer.bookingRef || customer.pnr || '-'}`;
  page.drawText(bookingRefText, { x: 42, y: 545, size: 10, font, color: rgb(0.18, 0.28, 0.38) });

  // --- Ticket Number / Issued Date table ---
  const tableY = 500;
  page.drawRectangle({ x: 30, y: tableY, width: 535, height: 26, color: yellowHeader, borderColor: warmBorder, borderWidth: 0.8 });
  page.drawText('Ticket Number', { x: 42, y: tableY + 8, size: 10, font: fontBold, color: rgb(0.18, 0.28, 0.38) });
  page.drawText('Issued Date',   { x: 380, y: tableY + 8, size: 10, font: fontBold, color: rgb(0.18, 0.28, 0.38) });

  const rowHeight = 32;
  const dataY = tableY - rowHeight;
  page.drawLine({ start: { x: 30, y: dataY }, end: { x: 565, y: dataY }, thickness: 1, color: warmBorder });
  page.drawLine({ start: { x: 30, y: dataY }, end: { x: 30, y: tableY }, thickness: 1, color: warmBorder });
  page.drawLine({ start: { x: 565, y: dataY }, end: { x: 565, y: tableY }, thickness: 1, color: warmBorder });
  page.drawText(customer.ticketNo || '-',   { x: 42,  y: dataY + 12, size: 10, font, color: rgb(0.18, 0.28, 0.38) });
  page.drawText(customer.issuedDate || '-', { x: 380, y: dataY + 12, size: 10, font, color: rgb(0.18, 0.28, 0.38) });

  // --- Build flight legs ---
  const renderFlights = [];
  const addLeg = (leg) => { if (leg.from || leg.to) renderFlights.push(leg); };

  if (customer.segments && customer.segments.length > 0) {
    customer.segments.forEach(seg => {
      if (seg.from || seg.to) {
        addLeg({
          ...seg,
          date: seg.departureDate,
          time: seg.departureTime,
          airline:    (seg.airline    || '').trim() ? seg.airline    : customer.airline,
          airlineLogo:(seg.airlineLogo || '').trim() ? seg.airlineLogo: customer.airlineLogo,
          flightNo:   (seg.flightNo   || '').trim() ? seg.flightNo   : customer.flightNo,
          class:      customer.class,
          airlineRef: (seg.airlineRef || '').trim() ? seg.airlineRef : customer.airlineRef,
          baggage:    (seg.baggage    || '').trim() ? seg.baggage    : customer.baggage,
          status:     (seg.status     || '').trim() ? seg.status     : customer.status,
          fareBasis:  (seg.fareBasis  || '').trim() ? seg.fareBasis  : customer.fareBasis,
          equipment:    seg.equipment    || '',
          departureTerminal: seg.departureTerminal || '',
          arrivalTerminal:   seg.arrivalTerminal   || '',
        });
      }
    });
  }

  if (customer.returnSegments && customer.returnSegments.length > 0) {
    customer.returnSegments.forEach(seg => {
        if (seg.from || seg.to) {
          addLeg({
            ...seg,
            date: seg.departureDate,
            time: seg.departureTime,
            arrivalDate: seg.arrivalDate,
            arrivalTime: seg.arrivalTime,
            duration:    seg.duration,
            airline:    (seg.airline    || '').trim() ? seg.airline    : customer.airline,
            airlineLogo:(seg.airlineLogo || '').trim() ? seg.airlineLogo: customer.airlineLogo,
            flightNo:   (seg.flightNo   || '').trim() ? seg.flightNo   : customer.flightNo,
            class:      customer.class,
            airlineRef: (seg.airlineRef || '').trim() ? seg.airlineRef : customer.airlineRef,
            baggage:    (seg.baggage    || '').trim() ? seg.baggage    : customer.baggage,
            status:     (seg.status     || '').trim() ? seg.status     : customer.status,
            fareBasis:  (seg.fareBasis  || '').trim() ? seg.fareBasis  : customer.fareBasis,
          equipment:    seg.equipment    || '',
          departureTerminal: seg.departureTerminal || '',
          arrivalTerminal:   seg.arrivalTerminal   || '',
        });
        }
      });
    }

  // Fallback if no segments
  if (renderFlights.length === 0) {
    if (customer.routeType === 'Direct') {
      addLeg({ date: customer.departureDate, time: customer.departureTime, from: customer.from, to: customer.to, airline: customer.airline, airlineLogo: customer.airlineLogo, flightNo: customer.flightNo, class: customer.class, airlineRef: customer.airlineRef, baggage: customer.baggage, status: customer.status, fareBasis: customer.fareBasis });
      if (customer.tripType === 'Round Trip') {
        addLeg({ date: customer.returnDate, time: customer.returnTime, from: customer.to, to: customer.from, airline: customer.airline, airlineLogo: customer.airlineLogo, flightNo: customer.returnSecondFlightNo || customer.flightNo, class: customer.class, airlineRef: customer.airlineRef, baggage: customer.baggage, status: customer.status, fareBasis: customer.fareBasis });
      }
    } else if (customer.routeType === 'Transit') {
      addLeg({ date: customer.departureDate, time: customer.departureTime, from: customer.from, to: customer.transitAirport, airline: customer.airline, airlineLogo: customer.airlineLogo, flightNo: customer.flightNo, class: customer.class, airlineRef: customer.airlineRef, baggage: customer.baggage, status: customer.status, fareBasis: customer.fareBasis });
      if (customer.transitAirport) {
        addLeg({ date: customer.departureDate, time: customer.transitTime, from: customer.transitAirport, to: customer.to, airline: customer.airline, airlineLogo: customer.airlineLogo, flightNo: customer.outboundSecondFlightNo || customer.flightNo, class: customer.class, airlineRef: customer.airlineRef, baggage: customer.baggage, status: customer.status, fareBasis: customer.fareBasis });
      }
      if (customer.tripType === 'Round Trip') {
        addLeg({ date: customer.returnDate, time: customer.returnTime, from: customer.to, to: customer.transitAirport, airline: customer.airline, airlineLogo: customer.airlineLogo, flightNo: customer.returnSecondFlightNo || customer.flightNo, class: customer.class, airlineRef: customer.airlineRef, baggage: customer.baggage, status: customer.status, fareBasis: customer.fareBasis });
        if (customer.transitAirport) {
          addLeg({ date: customer.returnDate, time: '', from: customer.transitAirport, to: customer.from, airline: customer.airline, airlineLogo: customer.airlineLogo, flightNo: customer.returnSecondFlightNo || customer.flightNo, class: customer.class, airlineRef: customer.airlineRef, baggage: customer.baggage, status: customer.status, fareBasis: customer.fareBasis });
        }
      }
    }
  }

  // --- Draw flight blocks ---
  let currentY = dataY - 50;
  let pageIdx = 0;

  for (let i = 0; i < renderFlights.length; i++) {
    if (currentY < 200) {
      pageIdx++;
      if (pageIdx < pdfDoc.getPageCount()) {
        page = pdfDoc.getPages()[pageIdx];
      } else {
        const doc2 = await PDFDocument.load(existingPdfBytes);
        const copyIdx = doc2.getPageCount() > 1 ? 1 : 0;
        const [newPage] = await pdfDoc.copyPages(doc2, [copyIdx]);
        pdfDoc.addPage(newPage);
        page = pdfDoc.getPages()[pdfDoc.getPageCount() - 1];
      }
      currentY = 750;
    }

    const fl = renderFlights[i];
    const blockTopY = currentY;

    // Header bar
    page.drawRectangle({ x: 30, y: currentY, width: 535, height: 26, color: yellowHeader, borderColor: warmBorder, borderWidth: 0.8 });
    const fDate = formatPDFDate(fl.date);
    page.drawText(fDate, { x: 40, y: currentY + 8, size: 10, font: fontBold, color: rgb(0.18, 0.28, 0.38) });
    page.drawText(fl.class || 'Economy', { x: 510, y: currentY + 8, size: 10, font: fontBold, color: rgb(0.18, 0.28, 0.38) });

    currentY -= 80;

    // Flight number box
    const flBoxTitle = (fl.flightNo || '').substring(0, 10).trim();
    page.drawRectangle({ x: 38, y: currentY + 55, width: 68, height: 18, color: yellowAccent, borderColor: warmBorder, borderWidth: 0.6 });
    page.drawText(flBoxTitle, { x: 42, y: currentY + 60, size: 11, font, color: rgb(0.18, 0.28, 0.38) });

    // Airline + Equipment (left column)
    if (fl.airlineLogo && fl.airlineLogo.trim().length >= 2) {
      try {
        const logoUrl = `https://pics.avs.io/200/200/${fl.airlineLogo.trim().toUpperCase()}.png`;
        const logoBytes = await fetch(logoUrl).then(res => res.arrayBuffer());
        const logoImage = await pdfDoc.embedPng(logoBytes);
        page.drawImage(logoImage, {
          x: 35,
          y: currentY + 33,
          width: 38,
          height: 18
        });
      } catch (err) {
         console.warn('Failed to draw logo', err);
      }
    }
    
    const airlineLabel = (fl.airline || '').substring(0, 28);
    page.drawText(airlineLabel, { x: 38, y: currentY + 22, size: 8, font, color: rgb(0.18, 0.28, 0.38) });
    if (fl.equipment) {
      page.drawText(`Equipment: ${fl.equipment}`, { x: 38, y: currentY + 11, size: 8, font, color: rgb(0.35, 0.40, 0.48) });
    }

    // From airport
    const origin = parseAirport(fl.from);
    page.drawText(origin.code, { x: 130, y: currentY + 60, size: 12, font: fontBold, color: rgb(0.18, 0.28, 0.38) });
    page.drawText(origin.rest.substring(0, 30), { x: 130, y: currentY + 46, size: 9, font, color: rgb(0.18, 0.28, 0.38) });
    page.drawText(`${fDate} ${fl.time || ''}`, { x: 130, y: currentY + 34, size: 9, font, color: rgb(0.18, 0.28, 0.38) });
    if (fl.departureTerminal) {
      page.drawText(`Terminal: ${fl.departureTerminal}`, { x: 130, y: currentY + 22, size: 8, font, color: rgb(0.35, 0.40, 0.48) });
    }

    // Duration
    page.drawText('Duration', { x: 340, y: currentY + 60, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
    page.drawText(fl.duration || '-', { x: 340, y: currentY + 48, size: 9, font, color: rgb(0.4, 0.4, 0.4) });

    // To airport
    const dest = parseAirport(fl.to);
    page.drawText(dest.code, { x: 410, y: currentY + 60, size: 12, font: fontBold, color: rgb(0.18, 0.28, 0.38) });
    page.drawText(dest.rest.substring(0, 30), { x: 410, y: currentY + 46, size: 9, font, color: rgb(0.18, 0.28, 0.38) });
    const arrivalFDate = formatPDFDate(fl.arrivalDate);
    const arrivalStr = (`${arrivalFDate} ${fl.arrivalTime || ''}`).trim();
    page.drawText(arrivalStr || '-', { x: 410, y: currentY + 34, size: 9, font, color: rgb(0.18, 0.28, 0.38) });
    if (fl.arrivalTerminal) {
      page.drawText(`Terminal: ${fl.arrivalTerminal}`, { x: 410, y: currentY + 22, size: 8, font, color: rgb(0.35, 0.40, 0.48) });
    }

    currentY -= 30;

    // Divider + meta row
    const dividerY = currentY + 12;
    page.drawLine({ start: { x: 30, y: dividerY }, end: { x: 565, y: dividerY }, thickness: 1, color: warmBorder });

    const metaXLeft = 38;
    const metaXMid  = 200;
    const metaYTop    = currentY - 4;
    const metaYBottom = currentY - 18;

    page.drawText(`Airline Ref:   ${clampMeta(fl.airlineRef || customer.airlineRef)}`, { x: metaXLeft, y: metaYTop,    size: 9, font, color: rgb(0.18, 0.28, 0.38) });
    page.drawText(`Baggage:   ${clampMeta(fl.baggage || customer.baggage)}`,           { x: metaXMid,  y: metaYTop,    size: 9, font, color: rgb(0.18, 0.28, 0.38) });
    page.drawText(`Status:   ${clampMeta(fl.status || customer.status)}`,              { x: metaXLeft, y: metaYBottom, size: 9, font, color: rgb(0.18, 0.28, 0.38) });
    page.drawText(`Fare Basis:   ${clampMeta(fl.fareBasis || customer.fareBasis)}`,    { x: metaXMid,  y: metaYBottom, size: 9, font, color: rgb(0.18, 0.28, 0.38) });

    // Block border
    const blockBottomY = metaYBottom - 12;
    page.drawLine({ start: { x: 30,  y: blockBottomY }, end: { x: 565, y: blockBottomY }, thickness: 1, color: warmBorder });
    page.drawLine({ start: { x: 30,  y: blockTopY    }, end: { x: 30,  y: blockBottomY }, thickness: 1, color: warmBorder });
    page.drawLine({ start: { x: 565, y: blockTopY    }, end: { x: 565, y: blockBottomY }, thickness: 1, color: warmBorder });

    currentY -= 75;
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = `${customer.passenger || 'Ticket'}_Ticket.pdf`;
  link.click();
};
