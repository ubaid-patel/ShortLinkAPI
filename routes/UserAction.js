var express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

/* GET home page. */
router.put('/changeName', async function (req, res, next) {
  const users  = req.db.collection("users");
  try{
    const verifyToken = await jwt.verify(req.query.token,process.env.SECRET_KEY);
    users.updateOne({ email: verifyToken.email },{$set:{name:req.query.name}});
    res.status(202).json({message:"Name changed successfully"})
  }catch(err){
    res.status(401).json({message:"Session expired"})
  }
});

router.post('/sendFeedback', async function (req, res, next) {
   const users  = req.db.collection("users");
   const message = req.query.message;
  try{
    const verifyToken = await jwt.verify(req.query.token,process.env.SECRET_KEY);
    users.updateOne({ email: verifyToken.email },{$addToSet: { feedbacks: { feedback: message, date:new Date().toISOString()} }});
    res.status(201).json({message:"Feedback sent"})
  }catch(err){
    res.status(401).json({message:"Session expired"})
  }
});

router.put('/changePassword', async function (req, res, next) {
  const users  = req.db.collection("users");
  try{
    const verifyToken = await jwt.verify(req.query.token,process.env.SECRET_KEY);
    const user = await users.findOne({ email: verifyToken.email });
    const userVerified =await bcrypt.compare(req.query.password,user.password)
    if(userVerified){
      const passh = bcrypt.hashSync(req.query.newPassword,5)
      users.updateOne({email:user.email},{$set:{password:passh}})
      res.status(202).json({message:"Password updated"})
    }else{
      res.status(401).json({message:"Incorrect password"})
    }
  }catch(err){
    res.status(401).json({...err,message:"Session expired"})
  }
});

router.delete('/deleteAccount', async function (req, res, next) {
  const users  = req.db.collection("users");
 try{
   const verifyToken = await jwt.verify(req.query.token,process.env.SECRET_KEY);
   const user = await users.findOne({ email: verifyToken.email });
   console.log(user.password)
   const userVerified = await bcrypt.compare(req.query.password,user.password)
   if(userVerified){
     users.deleteOne({email:verifyToken.email})
     res.status(202).json({message:"Account deleted"})
   }else{
     res.status(401).json({message:"Incorrect Password"})
   }
 }catch(err){
   res.status(401).json({message:"Session expired"})
 }
});

module.exports = router;
