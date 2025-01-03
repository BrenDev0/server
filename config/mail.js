 require("dotenv").config()
 const nodeMailer = require("nodemailer");
 
 // Create MailGun service 
 const transporter = nodeMailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: false,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD
    }
})

module.exports = transporter