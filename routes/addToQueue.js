const axios = require('axios')
async function addToQueue(email,otp){
    try {
        const apiURL = 'https://api.serverlessq.com?id='+process.env.MESSEGE_QUEUE_ID+'&target=https://urlpro.vercel.app/sendEmail';
    
        // Data to send in the request body
        const requestData = {
          email: email, // Replace this with the actual email
          otp: otp, // Replace this with the actual OTP
        };
    
        // Request headers
        const requestHeaders = {
          Accept: 'application/json',
          'x-api-key': process.env.MESSEGE_QUEUE_API_KEY,
          'Content-Type': 'application/json',
          'email':email,
          'otp':otp
        };
    
        // Make the POST request using Axios
        const response = await axios.post(apiURL, requestData, {
          headers: requestHeaders,
        });
    
        // Handle the response from the external API
       return(response.data)
      } catch (error) {
        // Handle any errors that occur during the request
        console.error('Error:', error);
      }
  
}
module.exports = addToQueue