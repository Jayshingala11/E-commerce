var express = require('express');
const userControler = require('../V1/controlers/userControler');
const authHelper = require('../V1/helpers/authHelper');
var router = express.Router();
const multer  = require('multer');

/* GET users listing. */

const storage = multer.diskStorage({
    destination: './src/images/',
    filename:(req, file, cb) => {
        return cb(null, `${file.fieldname}_${Date.now()}-${file.originalname}`);
    }
})

const upload = multer({
    storage: storage
})

router.post(`/register`, userControler.register);
router.post(`/login`, userControler.login);

router.get('/profile', authHelper.verifyToken, userControler.profile);

router.post('/product', userControler.product);

router.post('/productFetch', userControler.productFetch);

router.get('/getCart', userControler.getCart);

router.post('/otp', userControler.otp);

router.post('/verifyOTP', userControler.verifyOTP);

router.post('/itemFetch', userControler.itemFetch);

router.post('/itemDelete', userControler.itemDelete);

router.post('/checkIn', userControler.checkIn);

router.post('/checkOut', userControler.checkOut);

router.get('/getData', userControler.getData);

router.post('/deleteData', userControler.deleteData);

module.exports = router;
