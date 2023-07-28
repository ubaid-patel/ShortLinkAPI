var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var linkRouter = require('./routes/Links');
var userActionsRouter = require('./routes/UserAction');
var userAuthRouter = require('./routes/UserAuth');
var recoveryRouter = require('./routes/Recovery');
const cors = require('cors');
var app = express();
const sendOTP = require('./routes/sendOTP')
 
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// Set the allowed origin and credentials
const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
};

app.use(cors(corsOptions));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Database connection setup
const MongoClient = require('mongodb').MongoClient;
const dotenv = require('dotenv');
dotenv.config();
const connString = process.env.MONGO_CONNECTION_STRING;

let db; // Declare a variable to store the database connection
let dbReady = false; // Flag to indicate if the database connection is ready

// Function to establish the database connection
async function connectToDB() {
  try {
    const client = await MongoClient.connect(connString, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Connected To Db");
    db = client.db('urlpro'); // Store the connection in the db variable
    dbReady = true; // Set the flag to true once the connection is established
  } catch (err) {
    console.log(err);
  }
}     

// Call the connectToDB function to establish the connection when the application starts
connectToDB();

// Middleware to attach the database connection to the request object
app.use(async (req, res, next) => {
  if (dbReady) {
    req.db = db; // Reuse the existing connection
    next();
  } else {
    // Wait until the database connection is ready before proceeding to the next middleware
    const checkDBReady = () => {
      if (dbReady) {
        req.db = db; // Reuse the existing connection
        next();
      } else {
        setTimeout(checkDBReady, 100); // Check again after a short delay
      }
    };
    checkDBReady();
  }
});
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/auth', userAuthRouter);
app.use('/action', userActionsRouter);
app.use('/recovery', recoveryRouter);
app.use('/links', linkRouter);

app.get(["/","/login","Logout","/signup","/forgotPassword","/Dashboard","/Settings","/Feedback"],(req,res)=>{
  res.render('index')
})
app.post("/sendEmail",async function(req,res){
  if(req.headers.email && req.headers.otp){
    const send =  await sendOTP(req.headers.otp,req.headers.email)
  res.json({message:"email sent success "})
  }else{
    res.status(404).json({message:"Please pass email and otp in body"})
  }
  
})

app.get("/:endpoint",async function(req,res){
  const endpoint = req.params.endpoint;
  const links = req.db.collection("links")
  const link = await links.findOneAndUpdate({endpoint:endpoint},{$inc:{views:1}})
  res.redirect(link.value.url)
})
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});    

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
}); 
module.exports = app;
