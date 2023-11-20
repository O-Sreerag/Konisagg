// require('dotenv').config()
const nodemailer = require('nodemailer')

// const accountSid = process.env.AUTH_SID
// const authToken = process.env.AUTH_TOKEN


const sendOtp = (verifiedEmail, otpValue)=>{
    // const userPostOtpLogin = async function (req, res, next) {
        // let checkmail = await userdata.findOne({ useremail: req.body.useremail })
        // let OtpCode = Math.floor(100000 + Math.random() * 900000)
        // otp = OtpCode
        // otpEmail = checkmail.useremail
        let mailTransporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "konisagg.official@gmail.com",
            pass: "ytyc wsta opgs oebn"
          }
        })
        let docs = {
          from: "konisagg.official@gmail.com",
          to: verifiedEmail,
          subject: "Konisagg user Varification",
          text: `Hey there! we are thrilled to have you as a member of Konisagg community, ${otpValue} is your otp, please do not share it with others`
        }
        mailTransporter.sendMail(docs, (err) => {
          if (err) {
            console.log(err)
          }
        })       
}

module.exports= sendOtp