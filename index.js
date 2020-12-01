const router = module.exports = require('express').Router();


//--------------
router.use('/labs', require('./labs'));
router.use('/agents', require('./agents'));
