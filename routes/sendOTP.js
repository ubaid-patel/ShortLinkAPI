const mailer = require('nodemailer')
const dotenv = require('dotenv')
const ejs = require('ejs')
const path = require('path');
const fs = require('fs');
dotenv.config()

//Configure Mail Sender
const transporter = mailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD
  }
})
//Loads email template
const templatePath = path.join(__dirname, '../views', 'email.ejs');
const ejsTemplateContent = fs.readFileSync(templatePath, 'utf-8');

async function sendOTP(otp, email) {
  //render email template with otp
  const emailContent = ejs.render(ejsTemplateContent, { otp: otp });

  // Define email content
  const mailOptions = {
    from: process.env.MAIL_USERNAME,
    to: email,
    subject: 'URL PRO',
    html: emailContent,
  };
  return(
    new Promise((resolve,reject)=>{
        // Send email
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            reject(error)
          } else {
           resolve(info.response)
          }
        }
        )
    })
  )

}
module.exports = sendOTP