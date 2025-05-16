const express = require('express');
const {
  registerDeliveryman,
  loginDeliveryman,
  getPendingRequests,
  approveDeliveryman,
  denyDeliveryman,
  getApprovedDeliverymen,
  updateDeliverymanStatus
} = require('../controllers/deliveryman.controller');

const router = express.Router();

router.post('/register', registerDeliveryman);
router.post('/login', loginDeliveryman);
router.get('/requests', getPendingRequests);
router.put('/approve/:id', approveDeliveryman);
router.delete('/deny/:id', denyDeliveryman);
router.get('/approved', getApprovedDeliverymen);
router.put('/update-status/:id', updateDeliverymanStatus);

module.exports = router;
