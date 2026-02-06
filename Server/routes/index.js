const express = require('express');
const authRoutes = require('./auth');
const videoRoutes = require('./videos');
const adminRoutes = require('./admin');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/videos', videoRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
