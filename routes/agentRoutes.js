const router = require("express").Router()

const { getAgents } = require("../controllers/agentController.js")

router.get("/getagents", getAgents)


module.exports = router