var express = require('express');
var router = express.Router();
const bcrypt  = require('bcrypt');
const sendOTP = require('./sendOTP');
const addToQueue = require('./addToQueue')
function getRandomInt(min, max) {
  const randomDecimal = Math.random();
  const randomInt = Math.floor(randomDecimal * (max - min + 1) + min);
  return randomInt;
}
/* GET home page. */
router.post('/sendOTP',async function(req, res, next) {
  const users = req.db.collection("users");
  const otps = req.db.collection("otps");
  const user  = await users.findOne({email:req.query.email})
  if(user){
    const otp = getRandomInt(100000, 999999);
    const send  = await addToQueue(req.query.email,otp);
    console.log(send);
    otps.updateOne({ email: req.query.email }, { $set: { otp: otp, created_at: new Date() } }, { upsert: true })
    res.status(201).json({ message: "Otp sent successfully" });
  }else{
    res.status(401).json({ message: "Account not exist" });
  }
});

router.put('/resetPassword', async function(req, res, next) {
  const otps = req.db.collection("otps");
  const users = req.db.collection("users");
  const otp = await otps.findOne({email:req.query.email})
  if(otp){
    if(otp.otp == req.query.otp){
      const passh = bcrypt.hashSync(req.query.password,5)
      users.updateOne({email:req.query.email},{$set:{password:passh}})
      res.status(202).json({message:"Password reset successfull"})
    }else{
      res.status(401).json({message:"Invalid Otp"})
    }
  }else{
    res.status(404).json({message:"OTP not sent"})
  }
});
 
module.exports = router;
