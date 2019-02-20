var express = require('express');
var router = express.Router();

var rpgController = require("../../controllers/rpgController");
//Routes
router.get('/users/top/:index', rpgController.getTopUsers);
router.get('/users/:name', rpgController.getUsers);
router.get('/stats/:name', rpgController.getUserStats);
router.post('/create', rpgController.create);
router.post('/users/setImage', rpgController.setUserImage);
router.post('/mine', rpgController.mine);
router.post('/rest', rpgController.rest);
router.post('/battle', rpgController.battle);
router.post('/levelUp', rpgController.levelUp);
router.post('/buy', rpgController.buy);
router.post('/sell', rpgController.sell);
router.post('/createMonster', rpgController.createMonster);

module.exports = router;