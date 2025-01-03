const validator = require("validator")
const Agent = require("../class/Agent.js")
const jwt = require("jsonwebtoken")

// Returs token with encoded user data for use after email verification
const verifyEmail = async (req, res) => {
    const { name, email, phone, password } = req.body;
    // Check for valid Email
    if(!validator.isEmail(email)){
        return res.status(400).json({"message": "PLease Input a Valid Email"})
    }
    // Check for valid Phone Number
    if(!validator.isMobilePhone(phone, "es-MX")){
        return res.status(400).json({"message": "PLease Enter a Valid Phone Number"})
    }
    // Send verification email with token 
    const agent = new Agent(name, email, phone, password);
    try {
        const token = await agent.verifyEmail();
        return res.status(200).json({
            "message": "Verification Code Sent To Email: " + email,
            "token": token
        })
    } catch (error) {
        return res.status(500).json({"message": "Server Error"})
    }
}

const createAgent = async () => {
    const { token } = req.body;

    const agent = new Agent();
    const {name, email, phone, password} = await agent.verifyToken(token);
    await agent.createAgent(name, email, phone, password)

}

const login = async (req, res) => {
    const { name, email, password } = req.body;
    const agent = new Agent();
    await agent.login(email, password)

}

const getAgents = async (req, res) => {
    console.log("get agents")
    const agent = new Agent();
    return await agent.getAgents(req, res);
}


module.exports = { verifyEmail, createAgent, login, getAgents }


