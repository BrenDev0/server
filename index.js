require("dotenv").config()
const express = require("express");
const agentRoutes = require("./routes/agentRoutes.js")

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/agents", agentRoutes)


const server = () => {
    app.listen(process.env.SERVER_PORT, () => {
        console.log("online")
    })
}

server()