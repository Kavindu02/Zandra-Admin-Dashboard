const nodemailer = require('nodemailer');

const sendEmailInternal = async (customer, delayInfo = null, customStatus = null) => {
  if (!customer || !customer.email) {
    throw new Error('Customer email is required');
  }

  // Extract segments
  let segments = customer.segments;
  if (typeof segments === 'string') {
    try {
      segments = JSON.parse(segments);
    } catch (e) {
      segments = [];
    }
  }

  let returnSegments = customer.returnSegments;
  if (typeof returnSegments === 'string') {
    try {
      returnSegments = JSON.parse(returnSegments);
    } catch (e) {
      returnSegments = [];
    }
  }

  const outbound = (Array.isArray(segments) ? segments : []).filter(s => s && (s.from || s.to));
  const inbound = (Array.isArray(returnSegments) ? returnSegments : []).filter(s => s && (s.from || s.to));
  
  // Extract airport codes
  const getCode = (str) => {
    if (!str) return '---';
    const match = str.match(/\(([^)]+)\)/);
    return match ? match[1] : str.substring(0, 3).toUpperCase();
  };

  const getName = (str) => {
    if (!str) return 'Unknown';
    return str.split(' (')[0] || str;
  };

  // Logic for Origin and Destination
  let firstOut = outbound[0] || {};
  let lastOut = outbound[outbound.length - 1] || firstOut;
  let firstIn = inbound[0] || {};
  let lastIn = inbound[inbound.length - 1] || firstIn;

  // Affected Segment Logic for Delays
  const affected = delayInfo?.affectedSegment;
  
  const originCode = affected ? getCode(affected.from) : getCode(firstOut.from || customer.from);
  const originName = affected ? getName(affected.from) : getName(firstOut.from || customer.from);
  
  let destCode = affected ? getCode(affected.to) : getCode(lastOut.to || customer.to);
  let destName = affected ? getName(affected.to) : getName(lastOut.to || customer.to);

  if (!affected) {
    const currentLastOutCode = getCode(lastOut.to);
    const currentFirstInCode = getCode(firstIn.from);
    if (currentLastOutCode === currentFirstInCode && currentLastOutCode !== '---') {
      destCode = currentLastOutCode;
      destName = getName(lastOut.to);
    }
  }

  // Format date
  const flightDate = affected ? (affected.departureDate || delayInfo.newDepartureDate) : (firstOut.departureDate || customer.departureDate || '');
  const dateObj = new Date(flightDate);
  const formattedDate = !isNaN(dateObj.getTime()) 
    ? dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : 'Upcoming Date';

  const originalDepTime = affected ? (affected.departureTime || '--:--') : (firstOut.departureTime || customer.departureTime || '--:--');
  const originalArrTime = affected ? (affected.arrivalTime || '--:--') : (lastOut.arrivalTime || '--:--');
  
  const depTime = delayInfo?.newDepartureTime || originalDepTime;
  const arrTime = delayInfo?.newArrivalTime || originalArrTime;
  
  const airline = affected ? (affected.airline || 'Airline') : (firstOut.airline || customer.airline || 'Airline');
  const flightNo = affected ? (affected.flightNo || '--') : (firstOut.flightNo || customer.flightNo || '--');
  const pnr = customer.pnr || customer.bookingRef || 'N/A';

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        
        body { font-family: 'Inter', -apple-system, sans-serif; background-color: #f0f2f5; margin: 0; padding: 0; }
        .wrapper { background-color: #f0f2f5; padding: 40px 10px; }
        
        /* The Pass / Ticket Container */
        .pass-card { 
            max-width: 500px; 
            margin: 0 auto; 
            background: #ffffff; 
            border-radius: 20px; 
            overflow: hidden; 
            box-shadow: 0 10px 40px rgba(16, 29, 66, 0.08);
            border: 1px solid #e5e7eb;
        }
        
        /* Header Section */
        .pass-header { 
            background-color: #101d42; 
            padding: 20px 25px; 
            color: #ffffff;
            display: table;
            width: 100%;
            box-sizing: border-box;
        }
        .header-left { display: table-cell; vertical-align: middle; }
        .header-right { display: table-cell; vertical-align: middle; text-align: right; }
        .brand-name { font-size: 16px; font-weight: 900; letter-spacing: -0.5px; }
        .brand-name span { color: #f59e0b; }
        .status-text { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.7); }
        
        /* Main Itinerary Section */
        .pass-body { padding: 30px 25px; color: #1f2937; }
        
        .route-title { font-size: 14px; font-weight: 600; color: #6b7280; margin-bottom: 20px; }
        
        .route-grid { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .code { font-size: 32px; font-weight: 900; color: #101d42; line-height: 1; margin: 0; white-space: nowrap; }
        .city-label { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; margin-bottom: 4px; white-space: nowrap; }
        .time-label { font-size: 13px; font-weight: 700; color: #4b5563; margin-top: 8px; white-space: nowrap; }
        
        .old-time { text-decoration: line-through; color: #cbd5e1; font-weight: 400; font-size: 11px; margin-right: 5px; }
        .new-time { color: #f59e0b; }
        
        /* Sublte Arc Animation */
        .arc-container { position: relative; height: 70px; width: 100%; min-width: 120px; vertical-align: middle; overflow: visible; }
        .arc-line { 
            position: absolute; 
            width: 100px; 
            height: 40px; 
            border: 2px solid ${delayInfo ? '#fef3c7' : '#f3f4f6'}; 
            border-bottom: none; 
            border-radius: 100px 100px 0 0; 
            top: 20px; 
            left: 50%; 
            margin-left: -50px;
            z-index: 1; 
        }
        
        .plane-box { 
            position: absolute; 
            width: 30px; 
            height: 30px; 
            top: 20px;
            left: 50%;
            margin-left: -15px;
            z-index: 2; 
            -webkit-animation: movePlane 4s infinite ease-in-out;
            animation: movePlane 4s infinite ease-in-out;
        }
        
        @-webkit-keyframes movePlane {
            0% { -webkit-transform: translateX(-120px) translateY(10px) rotate(25deg); transform: translateX(-120px) translateY(10px) rotate(25deg); opacity: 0; }
            15% { opacity: 1; }
            50% { -webkit-transform: translateX(0) translateY(-35px) rotate(0deg); transform: translateX(0) translateY(-35px) rotate(0deg); }
            85% { opacity: 1; }
            100% { -webkit-transform: translateX(120px) translateY(10px) rotate(-25deg); transform: translateX(120px) translateY(10px) rotate(-25deg); opacity: 0; }
        }
        @keyframes movePlane {
            0% { transform: translateX(-120px) translateY(10px) rotate(25deg); opacity: 0; }
            15% { opacity: 1; }
            50% { transform: translateX(0) translateY(-35px) rotate(0deg); }
            85% { opacity: 1; }
            100% { transform: translateX(120px) translateY(10px) rotate(-25deg); opacity: 0; }
        }
        
        /* Responsive Tweaks */
        @media screen and (max-width: 480px) {
            .wrapper { padding: 20px 10px; }
            .pass-body { padding: 20px 15px; }
            .code { font-size: 28px; }
            .arc-container { min-width: 80px; height: 65px; }
            @-webkit-keyframes movePlane {
                0% { -webkit-transform: translateX(-80px) translateY(10px) rotate(25deg); opacity: 0; }
                50% { -webkit-transform: translateX(0) translateY(-30px) rotate(0deg); }
                100% { -webkit-transform: translateX(80px) translateY(10px) rotate(-25deg); opacity: 0; }
            }
            @keyframes movePlane {
                0% { transform: translateX(-80px) translateY(10px) rotate(25deg); opacity: 0; }
                50% { transform: translateX(0) translateY(-30px) rotate(0deg); }
                100% { transform: translateX(80px) translateY(10px) rotate(-25deg); opacity: 0; }
            }
        }
        
        .plane-icon { font-size: 24px; }
        
        /* Separator Perforation */
        .perforation { 
            height: 1px; 
            border-top: 1px dashed #e5e7eb; 
            margin: 25px 0; 
            position: relative;
        }
        .perforation::before, .perforation::after {
            content: ''; position: absolute; top: -8px; width: 16px; height: 16px; background: #f0f2f5; border-radius: 50%; border: 1px solid #e5e7eb;
        }
        .perforation::before { left: -34px; }
        .perforation::after { right: -34px; }
        
        /* Footer Info */
        .info-row { width: 100%; border-collapse: collapse; }
        .info-label { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 2px; }
        .info-val { font-size: 14px; font-weight: 700; color: #374151; padding-bottom: 20px; }
        
        .footer-note { 
            background-color: #f9fafb; 
            padding: 20px 25px; 
            border-top: 1px solid #f3f4f6; 
            text-align: center; 
            color: #9ca3af; 
            font-size: 11px; 
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="pass-card">
            <div class="pass-header">
                <div class="header-left">
                    <div class="brand-name">ZANDRA<span>TRAVELS</span></div>
                </div>
                <div class="header-right">
                    <div class="status-text">${delayInfo ? 'Flight Update' : (customStatus || 'Booking Confirm')}</div>
                </div>
            </div>
            
            <div class="pass-body">
                <div class="route-title">${formattedDate} • ${originName} to ${destName}</div>
                
                <table class="route-grid">
                    <tr>
                        <td width="80" align="left">
                            <div class="city-label">${originCode}</div>
                            <div class="code">${originCode}</div>
                            <div class="time-label">
                                ${delayInfo ? `<span class="old-time">${originalDepTime}</span><span class="new-time">${depTime}</span>` : depTime}
                            </div>
                        </td>
                        <td align="center">
                            <div class="arc-container">
                                <div class="arc-line"></div>
                                <div class="plane-box">
                                    <span class="plane-icon">✈️</span>
                                </div>
                            </div>
                            <div style="font-size: 10px; font-weight: 700; color: #9ca3af; margin-top: 25px;">
                                ${firstOut.duration || 'NON-STOP'}
                            </div>
                        </td>
                        <td width="80" align="right">
                            <div class="city-label">${destCode}</div>
                            <div class="code">${destCode}</div>
                            <div class="time-label">
                                ${delayInfo ? `<span class="old-time">${originalArrTime}</span><span class="new-time">${arrTime}</span>` : arrTime}
                            </div>
                        </td>
                    </tr>
                </table>
                
                <div class="perforation"></div>
                
                <table class="info-row">
                    <tr>
                        <td width="50%">
                            <div class="info-label">Passenger</div>
                            <div class="info-val">${customer.passenger}</div>
                        </td>
                        <td width="50%">
                            <div class="info-label">Confirmation</div>
                            <div class="info-val">#${pnr}</div>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div class="info-label">Carrier</div>
                            <div class="info-val">${airline}</div>
                        </td>
                        <td>
                            <div class="info-label">Flight</div>
                            <div class="info-val">${flightNo}</div>
                        </td>
                    </tr>
                </table>
            </div>
            
            <div class="footer-note">
                Ticket issued by Zandra Travels Administration.<br>
                Please find your e-ticket PDF attached to this email.<br>
                Please arrive at the airport 3 hours before departure.
            </div>
        </div>
    </div>
</body>
</html>
  `;

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const subject = delayInfo 
    ? `🚨 Flight Delay Notification: ${originCode} - ${destCode}`
    : `✈️ Flight Itinerary: ${originName} to ${destName}`;

  // Generate PDF Attachment
  let attachments = [];
  try {
    const { generateTicketPDFBuffer } = require('../utils/ticketPdfGenerator');
    const pdfBuffer = await generateTicketPDFBuffer(customer);
    attachments.push({
      filename: `${customer.passenger || 'Ticket'}_Flight_Itinerary.pdf`,
      content: pdfBuffer
    });
  } catch (pdfErr) {
    console.error('Failed to generate PDF for attachment:', pdfErr);
  }

  return await transporter.sendMail({
    from: `"Zandra Travels" <${process.env.EMAIL_USER || 'no-reply@zandra.com'}>`,
    to: customer.email,
    subject: subject,
    html: html,
    attachments: attachments
  });
};

const sendItineraryEmail = async (req, res) => {
  const { customer, delayInfo } = req.body;
  
  try {
    await sendEmailInternal(customer, delayInfo);
    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: error.message || 'Failed to send email. Check SMTP settings in .env file.' });
  }
};

module.exports = {
  sendItineraryEmail,
  sendEmailInternal
};
