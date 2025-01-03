const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();
const pool = require("../config/db.js")
const transporter = require("../config/mail.js")
const validator = require("validator")

class AgentController {
    // Generate token with encoded Data and duration of token
    // Returns encoded token
    generateToken(encodedData, limit){
        // Set the time limit of the token
       const duration = {expiresIn: limit}
       const key = process.env.TOKEN_KEY; 
       return jwt.sign(encodedData, key, duration)
    }

    // Returns decoded Token
    async verifyToken(token) {
        try {
            const key = process.env.TOKEN_KEY; // Secret used to sign the JWT
            return jwt.verify(token, key);  // Decodes the token and returns the payload
        } catch (err) {
            console.error('Error verifying token:', err);
            throw new Error('Invalid token');
        }
    }

    // Send verify email 
    async verifyEmail(req, res){
        try {
            const { email } = req.body
            const code = Math.floor(1000 + Math.random() * 9000)
            const text = `Tu código de verificación: ${code} expira en 15 minutos.`
            const verificationEmail = {
            from: process.env.MAIL_USER,
            to: email,
            subject: "Verify Email",
            text: text
        }

            // Check for valid Email
            if(!validator.isEmail(email)){
                return res.status(400).json({"message": "Please Input a Valid Email"})
            }
        
            // Verify that users email is not already in the database
            const sqlRead = "SELECT email FROM agentes WHERE email = ?"
            const [emailExists] = await pool.query(sqlRead, [email]);
            if(emailExists.length > 0){
                return res.status(400).json({"message": "Email Already In Use"});
            }
            
            // Send verification code
           await transporter.sendMail(verificationEmail);
            const encodedData = {
                verificationCode: code
            }
            
            const token = this.generateToken(encodedData, "15m")
            // Return token with user data to be used in CreateAgent
            return res.status(200).json({
                "message": "Validation Email Sent",
                "token": token
            })
        } catch (error) {
            console.log(error)
            return res.status(500).json({"message": "Your request can not be completed at this time please contact support"})
        } 
    }

    // Returns Token @ response.token
    async createAgent(req, res) {
        try {
            const { name, email, phone, password, token, code } = req.body;
            const decoded = await this.verifyToken(token);
            const { verificationCode } = decoded

            // Verify that users email is not already in the database
            const sqlRead = "SELECT email FROM agentes WHERE email = ?"
            const [emailExists] = await pool.query(sqlRead, [email]);
            if(emailExists.length > 0){
                return res.status(400).json({"message": "Email Already In Use"});
            }
        
            // check the code against user input
            if (code != verificationCode){
                return res.status(400).json({"message": "Incorrect Validation Code."})
            }

            // validate phone number
            if(!validator.isMobilePhone(phone, "es-MX")){
                return res.status(400).json({"message": "Please Enter a Valid Phone Number"})
            }

            const sqlInsert = "INSERT INTO agentes(desarrollador_id_desarrollador, nombre, email, password, phone) VALUES(?, ?, ?, ?, ?)";
            const hashedPassword = await bcrypt.hash(password,10);

            const [results] = await pool.query(sqlInsert, [1, name, email, hashedPassword, phone])
                
            // Generate Token
            const idToken = this.generateToken({id: results.insertId}, "8h")

            // Return the Token
            return res.status(201).json({
                "message": "User Created",
                "token": idToken
            })
            
            } catch (error) {
                console.log(error);
                return res.status(500).json({ "message": "Your request can not be completed at this time please contact support" });
            } 
    }

    async login(req, res){
        try {
            const { name, email, password } = req.body
            const sqlRead = "SELECT * FROM agentes WHERE nombre = ? AND email = ?"
            const [agent] = await pool.query(sqlRead, [name, email]);
            // Incorrect email or password
            if(agent.length < 1){
                return res.status(400).json({"message": "Incorrect Email or Password."})
            }
            const hashedPassword = agent[0].password;
            const passwordsMatch = await bcrypt.compare(password, hashedPassword);
            if(!passwordsMatch){
                return res.status(400).json({"message": "Incorrect Email or Password."})
            }
            // creacte token
            const token = this.generateToken({id: agent[0].id}, "8h")
            return res.status(200).json({
                "message": "Login Successful",
                "token": token
            })
        } catch (error) {
            console.log(error)
            return res.status(500).json({"message": "Your request can not be completed at this time please contact support"})
        }
    }

    async getAgents(req, res){
        try {
            const sqlRead = "SELECT * FROM agentes";
            const results = await pool.query(sqlRead)
            return res.status(200).json({"data": results})  
        } catch (error) {
            console.log(error)
            return
        }
    }


}



module.exports = AgentController
