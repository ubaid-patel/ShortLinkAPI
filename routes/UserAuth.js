var express = require('express');
var router = express.Router();
const sendOTP = require('./sendOTP');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const axios = require('axios');
const addToQueue = require('./addToQueue')

function getRandomInt(min, max) {
  const randomDecimal = Math.random();
  const randomInt = Math.floor(randomDecimal * (max - min + 1) + min);
  return randomInt;
}
const userResponse = {
  token: null,
  links: [],
  name: null,
  message: null,
  picture: undefined
}

function generateJwt(payload, expiresIn) {
  return jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: expiresIn })
}

async function Authenticate(users, query) {
  const user = await users.findOne({ email: query.email });
  if (user) {
    const correctPass = await bcrypt.compare(query.password, user.password);
    if (correctPass) {
      return ({ code: 200, user: user })
    } else {
      return ({ code: 401, message: "Incorrect Password" })
    }
  } else {
    return ({ code: 404, message: "User not exist" })
  }
}

async function Authorize(user, users, allLinks) {
  const token = generateJwt({ email: user.email }, '24H');
  //Create Links array
  const links = await allLinks.aggregate([
    { $match: { endpoint: { $in: user.endpoints }, }, },
    { $addFields: { createdOn: { $toDate: '$_id' }, }, },
    { $project: { _id: 0, endpoint: 1, url: 1, title: 1, views: 1, createdOn: 1, }, },
  ]).toArray();

  //If user is Admin
  if (user.email == process.env.ADMIN) {
    //Retrive users feedback
    const feedbacks = await users.aggregate([
      { $unwind: "$feedbacks" },
      { $project: { _id: 0, name: 1, email: 1, feedback: "$feedbacks.feedback", date: "$feedbacks.date" } },
      { $sort: { date: 1 } }
    ]).toArray();
    //Retrive Users info
    const allusers = await users.aggregate([
      { $project: { _id: 0, email: 1, name: 1, links: { $size: "$endpoints" }, feedbacks: { $size: "$feedbacks" } } }
    ]).toArray();
    return ({
      ...userResponse, token: token, picture: user.picture, name: 'Admin', links: links, users: allusers,
      feedbacks: feedbacks, message: "Login Success"
    })

  } else {
    console.log(user)
    return ({ ...userResponse, token: token, picture: user.picture, name: user.name, links: links, message: "Login Success" })
  }
}


const adminResponse = { ...userResponse, users: undefined, feedbacks: undefined }
/* GET home page. */
router.post('/signup', async function (req, res, next) {
  const otps = req.db.collection("otps");
  const users = req.db.collection("users");
  const passhash = await bcrypt.hash(req.body.password, 5);
  const user = await users.findOne({ email: req.body.email });
  if (user) {
    res.status(406).send({ message: "User Already Exist" })
  } else {
    const otp = await otps.findOne({ email: req.body.email })
    if (otp) {
      if (req.body.otp == otp.otp) {
        const token = generateJwt({email:req.body.email},'24H')
        await users.insertOne({ name: req.body.name, email: req.body.email, password: passhash, endpoints: [], feedbacks: [] })
        res.status(201).json({ ...userResponse, name: req.body.name, message: "Account Created Successfully", links: [], token: token })
      } else {
        res.status(401).send({ message: "Invalid Otp" });
      }
    } else {
      res.status(404).send({ message: "Otp Not Sent" });
    }
  }

});

router.post('/login', async function (req, res, next) {
  const users = req.db.collection("users");
  const allLinks = req.db.collection('links');
  const auth = await Authenticate(users, req.query);
  if (auth.code === 200) {
    const resp = await Authorize(auth.user, users, allLinks);
    res.status(200).json(resp)
  } else {
    res.status(auth.code).json({message:auth.message})
  }
});

router.post('/OAuth', async function (req, res, next) {
  const users = req.db.collection("users");
  const allLinks = req.db.collection("links");
  const config = { headers: { Authorization: `Bearer ${req.body.accessToken}` } };
  try {
    let user = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", config);
    user = user.data;
    const token = generateJwt({ email: user.email }, '24H')
    const existingUser = await users.findOne({ email: user.email });
    if (existingUser) {
      await users.updateOne({email:user.email},{$set:{picture:user.picture}});
      const resp = await Authorize({...existingUser,picture:user.picture}, users, allLinks);
      res.status(201).json(resp);
    } else {
      passhash = await bcrypt.hash(process.env.SECRET_KEY,5)
      const userObj = { picture: user.picture, email: user.email, name: user.name, endpoints: [], feedbacks: [],password:passhash};
      await users.insertOne(userObj);
      res.status(201).json({ message:"Account created",links:[],token: token,picture:user.picture,name:user.name, });
    }
  } catch (err) {
    res.status(401).json({ error: "UnAuthorized", message: "Authentication failed." });
  }
});


router.post('/sendOTP',async function (req, res, next) {
  const users = req.db.collection("users");
  const user = await users.findOne({email:req.body.email})
  if(user){
    res.status(406).send({ message: "User already exist" });
  }else{
  const otps = req.db.collection("otps");
  const otp = getRandomInt(100000, 999999);
  otps.updateOne({ email: req.body.email }, { $set: { otp: otp, created_at: new Date() } }, { upsert: true })
  const send  = await addToQueue(req.body.email,otp)
  console.log(send);
  res.status(201).send({ message: "otp sent successfully" });
  }
});

router.post('/refreshData', async function (req, res, next) {
  const users = req.db.collection("users");
  const allLinks = req.db.collection("links");
  try{
    const verifyToken = await jwt.verify(req.headers.authorization,process.env.SECRET_KEY);
    const user = await users.findOne({ email: verifyToken.email });
    const resp = await Authorize(user,users,allLinks)
    res.status(200).send(resp)
  }catch(err){
    res.status(401).send(err)
  }
});

module.exports = router;
