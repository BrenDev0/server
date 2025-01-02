require("dotenv").config()
const express = require("express");
const Agent = require("./class/Agent.js");
const agentRoutes = require("./routes/agentRoutes.js")

const app = express();

app.use("/agents", agentRoutes)


const server = () => {
    app.listen(8000, () => {
        console.log("online")
    })
}

server()