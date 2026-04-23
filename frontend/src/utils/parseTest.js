const fs = require('fs');

const sampleText = `E-TICKET
KULASINGHE A/RANJITH D K MR

Travel Details
Booking Ref 8XC2JL
Invoiced To
ZANDRA TRAVELS
Email: zandra.sscgroup@gmail.com

Ticket Number
2329608527601
Issued Date
2026-03-13

05 APR 2026
Economy
MH 178
CMB
Bandaranaike Intl Arpt
Colombo, Sri Lanka
05 APR 2026 00:05
Duration
03 hrs 45 mins
KUL
Kuala Lumpur International Arpt
Kuala Lumpur, Malaysia
05 APR 2026 06:20
Terminal: 1
Malaysia Airline System Berhad
Equipment: 73H
Airline Ref: 8XC2JL
Status: HK
Baggage: 45K
Fare Basis: BSDFLOLK

05 APR 2026
Economy
MH 70
KUL
Kuala Lumpur International Arpt
Kuala Lumpur, Malaysia
05 APR 2026 09:50
Terminal: 1
Duration
07 hrs 15 mins
NRT
Narita
Tokyo, Japan
05 APR 2026 18:05
Terminal: 2
Malaysia Airline System Berhad
Equipment: 333
Airline Ref: 8XC2JL
Status: HK
Baggage: 45K
Fare Basis: BSDFLOLK

Ticket Data
Coupon No Segment Departure Baggage
1 CMBKUL 05 Apr 2026 00:05 45 K
2 KULNRT 05 Apr 2026 09:50 45 K

Note
All times shown are local times
`;

function extractTicketData(text) {
  const result = { segments: [] };
  
  // Passenger
  const splitText = text.split('\n').filter(l => l.trim().length > 0);
  
  const eticketIndex = splitText.findIndex(l => l.includes('E-TICKET'));
  if (eticketIndex >= 0 && splitText.length > eticketIndex + 1) {
    result.passenger = splitText[eticketIndex + 1].trim();
  }

  // PNR
  const pnrMatch = text.match(/Booking Ref\s+([A-Z0-9]+)/i);
  if (pnrMatch) result.pnr = pnrMatch[1];

  // Ticket Number - try to find it below "Ticket Number" line
  const ticketIndex = splitText.findIndex(l => l.includes('Ticket Number'));
  if (ticketIndex >= 0) {
    // skip empty lines or other stuff, usually it's the next line containing digits
    for(let i=ticketIndex+1; i<splitText.length; i++){
      if (/\d{10,}/.test(splitText[i])) {
        result.ticketNo = splitText[i].match(/\d{10,}/)[0];
        break;
      }
    }
  }

  // Issued Date
  const issuedIndex = splitText.findIndex(l => l.includes('Issued Date'));
  if (issuedIndex >= 0) {
    for(let i=issuedIndex+1; i<splitText.length; i++){
      if (/20\d{2}-\d{2}-\d{2}/.test(splitText[i])) { // 2026-03-13
        result.issuedDate = splitText[i].trim();
        break;
      }
    }
  }

  // Segments (split by date like "05 APR 2026")
  // Let's create a robust parser by finding standard month patterns
  const dateRegex = /^\d{2}\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+\d{4}$/i;
  let currentSegment = null;
  
  for (let i = 0; i < splitText.length; i++) {
    const line = splitText[i].trim();
    
    // Stop at "Ticket Data" exactly
    if (line === 'Ticket Data' || line === 'Note') {
       break; 
    }

    if (dateRegex.test(line)) {
      if (currentSegment) {
        result.segments.push(currentSegment);
      }
      currentSegment = {
        _rawDate: line, 
        _lines: []
      };
      continue;
    }
    
    if (currentSegment) {
      currentSegment._lines.push(line);
      
      // Look for specific key-value pairs inline
      if (line.match(/^Equipment:\s*(.+)$/i)) currentSegment.equipment = line.match(/^Equipment:\s*(.+)$/i)[1];
      if (line.match(/^Terminal:\s*(.+)$/i)) {
          // there could be terminal 1 and 2
          if (!currentSegment.terminalFrom) currentSegment.terminalFrom = line.match(/^Terminal:\s*(.+)$/i)[1];
          else currentSegment.terminalTo = line.match(/^Terminal:\s*(.+)$/i)[1];
      }
      if (line.match(/^Airline Ref:\s*(.+)$/i)) currentSegment.airlineRef = line.match(/^Airline Ref:\s*(.+)$/i)[1];
      if (line.match(/^Status:\s*(.+)$/i)) currentSegment.status = line.match(/^Status:\s*(.+)$/i)[1];
      if (line.match(/^Baggage:\s*(.+)$/i)) currentSegment.baggage = line.match(/^Baggage:\s*(.+)$/i)[1];
      if (line.match(/^Fare Basis:\s*(.+)$/i)) currentSegment.fareBasis = line.match(/^Fare Basis:\s*(.+)$/i)[1];
      if (line.match(/^Duration\s*(.+)?$/i) && !line.includes('hrs')) {
          // Duration is next line
      } else if (line.match(/\d+\s*hrs\s*\d+\s*mins/i)) {
          currentSegment.duration = line.match(/\d+\s*hrs\s*\d+\s*mins/i)[0];
      }
    }
  }

  if (currentSegment) {
    result.segments.push(currentSegment);
  }
  
  // Post process semantic lines for segments
  result.segments.forEach(seg => {
    // Classes
    seg.class = seg._lines[0]; // e.g. "Economy"
    seg.flightNo = seg._lines[1]; // e.g. "MH 178"
    
    // Dates & Airports
    // Standard format lists Origin, Destination, but varies in layout.
    // e.g., CMB Bandaranaike... Colombo... 05 APR 2026 00:05
    const dateTimes = seg._lines.filter(l => l.match(/\d{2} (JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC) \d{4} \d{2}:\d{2}/i));
    
    if (dateTimes.length >= 1) {
        seg.departureDate = dateTimes[0];
    }
    if (dateTimes.length >= 2) {
        seg.arrivalDate = dateTimes[1];
    }
    
    // Airlines usually above Equipment
    const eqIdx = seg._lines.findIndex(l => l.startsWith('Equipment:'));
    if (eqIdx > 0 && !seg._lines[eqIdx-1].startsWith('Terminal')) {
        seg.airline = seg._lines[eqIdx-1]; // e.g. "Malaysia Airline System Berhad"
    }

    // Origin airport code usually a 3-letter code after Flight No
    const l2 = seg._lines[2];
    if (l2 && l2.length === 3 && l2 === l2.toUpperCase()) seg.from = l2;
    
    // Destination is usually exactly 3 letters right after Duration mins line, or after from details 
    const nrtLine = seg._lines.find(l => l.length === 3 && l === l.toUpperCase() && l !== seg.from);
    if (nrtLine) seg.to = nrtLine;

    delete seg._lines;
  });

  return result;
}

console.log(JSON.stringify(extractTicketData(sampleText), null, 2));
