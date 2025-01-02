const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");
const nodeMailer = require("nodemailer");
const bcrypt = require("bcrypt");
require("dotenv").config();

class Agent {
   constructor(){
        this.jwtKey = process.env.TOKEN_KEY

        //Create connection
        this.connection = mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB,
            port: 3306
        })
       

        // Create MailGun service 
        this.transporter = nodeMailer.createTransport({
            host: process.env.MAIL_HOST,
            port: process.env.MAIL_PORT,
            secure: false,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASSWORD
            }
        })
       
    }


    // Generate token with encoded Data and duration of token
    // Returns encoded token
    generateToken(encodedData, limit){
        // Set the time limit of the token
       const duration = {expiresIn: limit}

       return jwt.sign(encodedData, this.jwtKey, duration)
    }

    // Returns decoded Token
    verifyToken(token){
        return new Promise((resolve, reject) => {

            jwt.verify(token, this.jwtKey, (error, decoded ) => {
                if(error) {
                    return reject(error)
                }

                resolve(decoded)
            })
        })
    }

    // Send verify email 
    async verifyEmail(req, res){
        const { name, userEmail, phone, password } = req.body
        const code = Math.floor(1000 + Math.random() * 9000)
        const text = `Your Verification Code is: ${code}`
        const email = {
            from: process.env.MAIL_USER,
            to: userEmail,
            subject: "Verify Email",
            text: text
        }
        
        try {
            // Verify that users email is not already in the database
            const sqlRead = "SELECT email FROM agentes WHERE email = ?"
            const [emailExists] = await this.connection.execute(sqlRead, [userEmail]);
            if(emailExists.length > 0){
                return res.status(400).json({"message": "Email Already In Use"});
            }
            
            // Send verification code
           await this.transporter.sendMail(email);
            const encodedData = {
                name: name,
                email: userEmail,
                phone: phone,
                password: password
            }
            // Return token with user data to be used in CreateAgent
            return this.generateToken(encodedData, "1h")
        } catch (error) {
            console.log(`error: ${error}`)
            throw error 
        } finally {
            this.connection.close()
        }
    }

    // Returns Token @ response.token
    async createAgent(req, res) {
        try {
            const { name, email, phone, password } = req.body
            const sqlInsert = "INSERT INTO agentes(name, email, phone, password) VALUES(?, ?, ?, ?)";
            const hashedPassword = await bcrypt.hash(password,10);

            const [results] = await this.connection.execute(sqlInsert, [name, email, phone, hashedPassword])
                
                // Generate Token
               const token = this.generateToken({id: results.insertId}, "8h")

                // Return the Token
              return res.status(201).json({
                    "message": "User Created",
                    "token": token
                })
            
            } catch (error) {

                console.log(error);
                return res.status(500).json({ "message": "Internal Server Error" });
            } finally {

                this.connection.close();
                return;
            }
    }

    async login(req, res,){
        try {
            const { email, password } = req.body
            const sqlRead = "SELECT * FROM agentes WHERE name = ?, AND email = ?"
            const [agent] = await this.connection.execute(sqlRead, [name, email]);
            // Incorrect email or password
            if(agent.length < 1){
                return res.status(400).json({"message": "Incorrect Email or Password."})
            }
            const hashedPassword = agent.password;
            const passwordsMatch = await bcrypt.compare(password, hashedPassword);
            if(!passwordsMatch){
                return res.status(400).json({"message": "Incorrect Email or Password."})
            }
            // creacte token
            const token = this.generateToken({id: agent.id}, "8h")
            return res.status(200).json({
                "message": "Login Successful",
                "token": token
            })
        } catch (error) {
            console.log(error)
        } finally {
            this.connection.close()
        }
    }

    async getAgents(){
        const sqlRead = "SELECT * FROM agentes";
        const results = await this.connection.execute(sqlRead);
        return res.status(200).json({"data": results})
    }


}


module.exports = Agent
