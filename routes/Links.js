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
  if(req.headers.authorization){
    try{
      const verifyToken = jwt.verify(req.headers.authorization,process.env.SECRET_KEY)
      user.isVerified = true;
      user.email = verifyToken.email
    }catch(err){
     return res.status(401).json({...err,message:"Session expired"})
    }
  }
  while(inserted === false){
    try{
      const endpoint = uniqueEnd(6);
      await allLinks.insertOne({url:req.body.url,endpoint:endpoint,title:req.body.title,views:0})
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

router.put('/updateLink/:endpoint', function(req, res, next) {
  const allLinks = req.db.collection("links");
  console.log(req.body)
  if(req.headers.authorization){
    try{
      jwt.verify(req.headers.authorization,process.env.SECRET_KEY)
    }catch(err){
      return res.status(401).json({...err,message:"Session expired"})
    }
  }
  allLinks.updateOne({endpoint:req.params.endpoint}, {$set:{url:req.body.url,title:req.body.title } })
  res.status(202).json({message:"Changes saved"})
});

router.get("/getLink/:endpoint",async function(req,res){
  const endpoint = req.params.endpoint;
  const links = req.db.collection("links")
  const link = await links.findOneAndUpdate({endpoint:endpoint},{$inc:{views:1}})
  res.status(200).send(link.value);
})

router.delete('/deleteLink/:endpoint', function(req, res, next) {
  const allLinks = req.db.collection("links");
  const users = req.db.collection("users");
  if(req.headers.authorization){
    try{
      const verify = jwt.verify(req.headers.authorization,process.env.SECRET_KEY)
      users.updateOne({email:verify.email},{$pull:{endpoints:req.params.endpoint}})
    }catch(err){
      return res.status(401).json({...err,message:"Session expired"})
    }
  }
  allLinks.deleteOne({endpoint:req.body.endpoint})
  res.status(202).json({message:"Link deleted"})
});

module.exports = router;
