const { google } = require('googleapis');
const { readFileSync } = require('fs');

// Load credentials
const credentials = JSON.parse(readFileSync('credentials.json', 'utf-8'));

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = '1xZoHg-1DmjuyqzUFb0v_RQWUesXAcjfzOKe2bO_81zk'; // Updated to actual form responses

// Cache for ultra-fast lookups
let participantsCache = new Map();
let lastCacheUpdate = 0;
const CACHE_DURATION = 30000; // 30 seconds cache

// Load all participants into cache for ultra-fast lookups
async function loadParticipantsCache() {
  try {
    console.log('🔄 Loading participants cache...');
    const range = "'Form Responses 1'!A2:J";
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range,
    });

    const rows = response.data.values || [];
    participantsCache.clear();
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const ticketId = row[9]; // Column J contains ticket ID
      
      if (ticketId) {
        participantsCache.set(ticketId, {
          name: row[3] || 'Unknown',        // Column D - NAME
          email: row[1] || '',              // Column B - Email Address  
          phone: row[5] || '',              // Column F - PHONE NUMBER
          status: row[8] || '',             // Column I - Status
          ticketId: row[9] || '',           // Column J - Ticket ID
          rrn: row[2] || '',               // Column C - RRN
          degreeAndBranch: row[4] || '',   // Column E - DEGREE AND BRANCH
          row: i + 2 // +2 because we start from A2
        });
      }
    }
    
    lastCacheUpdate = Date.now();
    console.log(`✅ Cache loaded: ${participantsCache.size} participants`);
    return true;
  } catch (error) {
    console.error('Error loading cache:', error);
    return false;
  }
}

async function verifyTicket(ticketId) {
  try {
    // Check if cache needs refresh
    if (Date.now() - lastCacheUpdate > CACHE_DURATION || participantsCache.size === 0) {
      await loadParticipantsCache();
    }
    
    // Ultra-fast cache lookup
    const participant = participantsCache.get(ticketId);
    
    if (participant) {
      return {
        valid: true,
        participant: participant
      };
    }
    
    return { valid: false, message: 'Ticket not found' };
  } catch (error) {
    console.error('Error verifying ticket:', error);
    return { valid: false, message: 'Verification failed' };
  }
}

async function markAsCheckedIn(participantRow, ticketId) {
  try {
    // Update status to "Checked In" in column I
    const range = `'Form Responses 1'!I${participantRow}`;
    const values = [['Checked In']];
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: 'RAW',
      resource: { values }
    });
    
    console.log(`✅ Marked ticket ${ticketId} as checked in`);
    
    // Update cache immediately
    const participant = participantsCache.get(ticketId);
    if (participant) {
      participant.status = 'Checked In';
      participantsCache.set(ticketId, participant);
    }
    
    return true;
  } catch (error) {
    console.error('Error marking as checked in:', error);
    return false;
  }
}

// Initialize cache on startup
loadParticipantsCache();

module.exports = {
  verifyTicket,
  markAsCheckedIn,
  loadParticipantsCache
};

