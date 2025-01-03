require("dotenv").config()
const express = require("express");
const agentRoutes = require("./routes/agentRoutes.js")
const awsServerlessExpress = require("aws-serverless-express")

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/agents", agentRoutes)


const server = awsServerlessExpress.createServer(app)

exports.handler = (event, context) => {
    awsServerlessExpress.proxy(server, event, context)
}