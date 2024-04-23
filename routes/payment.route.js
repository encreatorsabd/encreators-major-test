const express = require('express');
const router = express.Router();

// Route to render payment page
router.get('/payment', (req, res) => {
    res.render('payment');
});

module.exports = router;
