const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();
const pool = require("../db.js")
const transporter = require("../mail.js")
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
    verifyToken(token){
        return new Promise((resolve, reject) => {
            const key = process.env.TOKEN_KEY;
            jwt.verify(token, key, (error, decoded ) => {
                if(error) {
                    return reject(error)
                }

                resolve(decoded)
            })
        })
    }

    // Send verify email 
    async verifyEmail(req, res){
        try {
            const { name, email, phone, password } = req.body
            const code = Math.floor(1000 + Math.random() * 9000)
            const text = `Your Verification Code: ${code} Expires In 15 Minutes`
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
            // Check for valid Phone Number
            if(!validator.isMobilePhone(phone, "es-MX")){
                return res.status(400).json({"message": "Please Enter a Valid Phone Number"})
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
                name: name,
                email: email,
                phone: phone,
                password: password,
                code: code
            }
            
            const token = this.generateToken(encodedData, "15m")
            // Return token with user data to be used in CreateAgent
            return res.status(200).json({
                "message": "Validation Email Sent",
                "token": token
            })
        } catch (error) {
            console.log(error)
            return res.status(500).json({"message": "Internal Error"})
        } 
    }

    // Returns Token @ response.token
    async createAgent(req, res) {
        try {
            const { token, userCode } = req.body;
            const decoded = await this.verifyToken(token);
            const { name, email, phone, password, code } = decoded
            if (code !== userCode){
                return res.status(400).json({"message": "Incorrect Validation Code."})
            }
            const sqlInsert = "INSERT INTO agentes(name, email, phone, password) VALUES(?, ?, ?, ?)";
            const hashedPassword = await bcrypt.hash(password,10);

            const [results] = await pool.query(sqlInsert, [name, email, phone, hashedPassword])
                
            // Generate Token
            const idToken = this.generateToken({id: results.insertId}, "8h")

            // Return the Token
            return res.status(201).json({
                "message": "User Created",
                "token": idToken
            })
            
            } catch (error) {
                console.log(error);
                return res.status(500).json({ "message": "Internal Error" });
            } 
    }

    async login(req, res){
        try {
            const { name, email, password } = req.body
            const sqlRead = "SELECT * FROM agentes WHERE name = ? AND email = ?"
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
            return res.status(500).json({"message": "Internal Error"})
        }
    }

    async getAgents(req, res){
        const sqlRead = "SELECT * FROM agentes";
        const results = await pool.query(sqlRead)
        return res.status(200).json({"data": results})
    }


}


module.exports = AgentController
