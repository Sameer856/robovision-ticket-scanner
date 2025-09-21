const express = require('express');
const router = express.Router();
const { verifyTicket, markAsCheckedIn, loadParticipantsCache } = require('../services/sheetsService');

// Verify ticket endpoint
router.post('/verify', async (req, res) => {
  try {
    const { ticketId } = req.body;
    
    if (!ticketId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ticket ID is required' 
      });
    }
    
    console.log(`🔍 Verifying ticket: ${ticketId}`);
    
    const result = await verifyTicket(ticketId);
    
    if (result.valid) {
      const { participant } = result;
      
      // Check if already checked in
      if (participant.status === 'Checked In') {
        return res.json({
          success: false,
          message: 'Ticket already used',
          participant: {
            name: participant.name,
            email: participant.email,
            status: participant.status
          }
        });
      }
      
      // Check if ticket was sent
      if (participant.status !== 'Ticket Sent') {
        return res.json({
          success: false,
          message: 'Invalid ticket status',
          participant: {
            name: participant.name,
            email: participant.email,
            status: participant.status
          }
        });
      }
      
      return res.json({
        success: true,
        message: 'Valid ticket',
        participant: {
          name: participant.name,
          email: participant.email,
          phone: participant.phone,
          status: participant.status,
          ticketId: participant.ticketId
        }
      });
    } else {
      return res.json({
        success: false,
        message: result.message || 'Invalid ticket'
      });
    }
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during verification'
    });
  }
});

// Check-in endpoint
router.post('/checkin', async (req, res) => {
  try {
    const { ticketId } = req.body;
    
    if (!ticketId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ticket ID is required' 
      });
    }
    
    console.log(`✅ Checking in ticket: ${ticketId}`);
    
    // First verify the ticket
    const verifyResult = await verifyTicket(ticketId);
    
    if (!verifyResult.valid) {
      return res.json({
        success: false,
        message: 'Invalid ticket - cannot check in'
      });
    }
    
    const { participant } = verifyResult;
    
    // Check if already checked in
    if (participant.status === 'Checked In') {
      return res.json({
        success: false,
        message: 'Already checked in',
        participant: {
          name: participant.name,
          checkedInTime: 'Previously checked in'
        }
      });
    }
    
    // Mark as checked in
    const checkInSuccess = await markAsCheckedIn(participant.row, ticketId);
    
    if (checkInSuccess) {
      return res.json({
        success: true,
        message: 'Successfully checked in',
        participant: {
          name: participant.name,
          email: participant.email,
          checkedInTime: new Date().toLocaleString()
        }
      });
    } else {
      return res.json({
        success: false,
        message: 'Failed to update check-in status'
      });
    }
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during check-in'
    });
  }
});

// Bulk verify endpoint for ultra-fast processing
router.post('/bulk-verify', async (req, res) => {
  try {
    const { ticketIds } = req.body;
    
    if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'TicketIds array is required' 
      });
    }
    
    console.log(`🔍 Bulk verifying ${ticketIds.length} tickets`);
    
    const results = [];
    for (const ticketId of ticketIds) {
      const result = await verifyTicket(ticketId);
      results.push({
        ticketId,
        valid: result.valid,
        participant: result.participant || null,
        message: result.message || null
      });
    }
    
    return res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Bulk verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during bulk verification'
    });
  }
});

// Cache refresh endpoint
router.post('/refresh-cache', async (req, res) => {
  try {
    console.log('🔄 Manual cache refresh requested');
    const success = await loadParticipantsCache();
    
    if (success) {
      res.json({
        success: true,
        message: 'Cache refreshed successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to refresh cache'
      });
    }
  } catch (error) {
    console.error('Cache refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during cache refresh'
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Scanner API is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

