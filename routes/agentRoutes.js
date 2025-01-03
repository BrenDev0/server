const router = require("express").Router()
const AgentController = require("../class/AgentController")
const agentController = new AgentController();

router.post("/verifyemail", agentController.verifyEmail.bind(agentController))
router.post("/createagent", agentController.createAgent.bind(agentController))
router.post("/login", agentController.login.bind(agentController))


module.exports = router