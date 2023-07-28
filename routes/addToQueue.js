const axios = require('axios')
async function addToQueue(email,otp){
    try {
        const apiURL = 'https://api.serverlessq.com?id=ea2d6e0c-e4ae-485f-a636-5dbbd6ed0b6c&target=https://urlpro.vercel.app/sendEmail';
    
        // Data to send in the request body
        const requestData = {
          email: email, // Replace this with the actual email
          otp: otp, // Replace this with the actual OTP
        };
    
        // Request headers
        const requestHeaders = {
          Accept: 'application/json',
          'x-api-key': '5eea29b1a25c765fc0b0bcb21e89e731886d050292ec0a2aa5e2c51ca61e0f6b',
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