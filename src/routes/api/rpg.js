var express = require('express');
var router = express.Router();

var rpgController = require("../../controllers/rpgController");
//Routes
router.get('/stats/:name', rpgController.stats);
router.post('/create', rpgController.create);
router.post('/mine', rpgController.mine);
router.post('/rest', rpgController.rest);
router.post('/battle', rpgController.battle);
router.post('/levelUp', rpgController.levelUp);
router.post('/buy', rpgController.buy);
router.post('/sell', rpgController.sell);
router.post('/createMonster', rpgController.createMonster);

module.exports = router;