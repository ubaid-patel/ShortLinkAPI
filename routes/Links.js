const { all } = require('axios');
var express = require('express');
var router = express.Router();
const jwt  = require('jsonwebtoken')

function uniqueEnd(len) {
  const characters = "QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm1234567890";
  let rand = "";
  for (let i = 0; i < len; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    rand += characters.charAt(randomIndex);
  }
  return rand;
}

 

/* GET home page. */
router.post('/createLink',async function(req, res, next) {
  const allLinks = req.db.collection("links");
  const users = req.db.collection("users");
  let inserted = false;
  let user = {isVerified:false,email:null};
  if(req.query.token){
    try{
      const verifyToken = jwt.verify(req.query.token,process.env.SECRET_KEY)
      user.isVerified = true;
      user.email = verifyToken.email
    }catch(err){
     return res.status(401).json({...err,message:"Session expired"})
    }
  }
  while(inserted === false){
    try{
      const endpoint = uniqueEnd(6);
      await allLinks.insertOne({url:req.query.url,endpoint:endpoint,title:req.query.title,views:0})
      inserted = true;
      if(user.isVerified){
        users.updateOne({email:user.email},{$addToSet:{endpoints:endpoint}})
      }
      res.status(201).send({endpoint:endpoint,message:"Link created success"})
    }catch(err){
      console.log("Endpoint already exist")
    }
  }
});

router.put('/updateLink', function(req, res, next) {
  const allLinks = req.db.collection("links");
  if(req.query.token){
    try{
      jwt.verify(req.query.token,process.env.SECRET_KEY)
    }catch(err){
      return res.status(401).json({...err,message:"Session expired"})
    }
  }
  allLinks.updateOne({endpoint:req.query.endpoint}, {$set:{url:req.query.url,title:req.query.title } })
  res.status(202).json({message:"Changes saved"})
});

router.delete('/deleteLink', function(req, res, next) {
  const allLinks = req.db.collection("links");
  const users = req.db.collection("users");
  if(req.query.token){
    try{
      const verify = jwt.verify(req.query.token,process.env.SECRET_KEY)
      users.updateOne({email:verify.email},{$pull:{endpoints:req.query.endpoint}})
    }catch(err){
      return res.status(401).json({...err,message:"Session expired"})
    }
  }
  allLinks.deleteOne({endpoint:req.query.endpoint})
  res.status(202).json({message:"Link deleted"})
});

module.exports = router;
