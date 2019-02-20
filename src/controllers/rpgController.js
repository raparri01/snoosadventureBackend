var admin = require("firebase-admin");
var serviceAccount = require("../credentials/snoosadventure-firebase-adminsdk-1u6dk-67e85772eb");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
var db = admin.firestore();
const settings = { timestampsInSnapshots: true };
db.settings(settings);

exports.getTopUsers = async function(req, res) {
  let userRef = db
    .collection("adventurers")
    .orderBy("level")
    .startAt(req.params.index - 1)
    .limit(25);
  let users = await userRef.get();
  let usersArray = [];
  users.forEach(doc => usersArray.splice(0, 0, doc.data()));
  res.send({ users: usersArray });
};
exports.getUsers = async function(req, res) {
  //need to come back to this when firestore updates to allow search of substrings within fields
  //In the meantime, use algolia to accomplish.
  let userRef = db.collection("adventurers");
  let users = await userRef.where("name", "==", `%${req.params.name}%`).get();
  let usersArray = [];
  users.forEach(doc => {
    usersArray.push(doc.data());
  });

  res.send({ users: usersArray });
};

exports.getUserStats = function(req, res) {
  let userRef = db.collection("adventurers").doc(req.params.name);
  userRef.get().then(user => {
    if (user.exists) {
      res.send(
        `Your stats are: energy: level: ${user.data().level}, health: ${
          user.data().health
        }, energy: ${user.data().energy}, experience:${
          user.data().experience
        }, experienceNeeded: ${user.data().experienceNeeded}, gold: ${
          user.data().gold
        }, max energy: ${user.data().maxEnergy}, maxHealth: ${
          user.data().maxHealth
        }`
      );
    } else {
      res.send({ exists: false });
    }
  });
};
exports.setUserImage = function(req, res) {
  let userRef = db.collection("adventurers").doc(req.body.user);
  userRef.get().then(user => {
    if (user.exists) {
      userRef.update({img: req.body.imageLink});
      res.send("Your image has been set!");
    } else {
      res.send("This adventurer does not exist");
    }
  });
};
exports.create = function(req, res, next) {
  let userRef = db.collection("adventurers").doc(req.body.user);
  userRef.get().then(user => {
    if (user.exists) {
      res.send("This adventurer has already been created");
    } else {
      let setAdventurer = userRef.set({
        name: req.body.user,
        level: 1,
        health: 10,
        maxHealth: 10,
        energy: 100,
        maxEnergy: 100,
        experience: 0,
        experienceNeeded: 2,
        gold: 0,
        img: "",
        inventory: [],
        equipped: {
          weapon: "",
          armor: ""
        },
        createdOn: Date.now()
      });
      res.send({ message: `Welcome to the adventure, ${req.body.user}!` });
    }
  });
};

exports.mine = function(req, res, next) {
  var userRef = db.collection("adventurers").doc(req.body.user);
  userRef
    .get()
    .then(stats => {
      if (stats.exists) {
        if (stats.data().energy >= 10) {
          userRef.update({ energy: stats.data().energy - 10 });
          userRef.collection("inventory").add(materials.getItem());
          res.send(
            `Added ${materials.getItem().name} to ${req.body.user}'s inventory`
          );
        } else {
          res.send("You don't have enough energy to mine");
        }
      } else {
        res.send("This character hasn't been created yet");
      }
    })
    .catch(error => {
      console.log(error);
    });
};

exports.rest = function(req, res) {
  let userRef = db.collection("adventurers").doc(req.body.user);

  userRef.get().then(stats => {
    if (stats.exists) {
      if (
        stats.data().gold >=
        (stats.data().maxHealth - stats.data().health) / 2
      ) {
        userRef.update({
          gold:
            stats.data().gold -
            (stats.data().maxHealth() - stats.data().health) / 2,
          health: stats.data().maxHealth
        });
        res.send(
          `You are all set, that will be ${(stats.data().maxHealth -
            stats.data().health) /
            2} gold`
        );
      }
    } else {
      res.send("You don't have enough gold to heal right now!");
    }
  });
};

exports.battle = async function(req, res, next) {
  let userRef = db.collection("adventurers").doc(req.body.user);
  let monsterRef = db.collection("monsters").doc(req.body.monster);
  let user = await userRef.get();
  user = user.data();
  let monster = await monsterRef.get();
  if (monster && user) {
    monster = monster.data();
    let battleRecord = [];
    let weaponMultiplier =
      user.equipped.weapon.length > 0
        ? user.level * user.equipped.weapon.multiplier
        : 1.3;
    let armorMultiplier =
      user.equipped.armor.length > 0
        ? user.level * user.equipped.armor.multiplier
        : 1.0;
    while (monster.health > 0 && user.health > 0) {
      let userDamage = user.level * weaponMultiplier * (Math.random() * 3);
      let monsterDamage =
        monster.attack * (Math.random() * 3) * armorMultiplier;
      monster.health -= userDamage;
      user.health -= monsterDamage;
      battleRecord.push(
        `user deals: ${userDamage}, Monster deals: ${monsterDamage}`
      );
      battleRecord.push(
        `user Health: ${user.health}, MonsterHealth: ${monster.health}`
      );
    }
    let win = monster.health > user.health ? false : true;
    let finalMessage;
    if (win) {
      finalMessage = `You win! You have recieved ${monster.gold} gold and ${
        monster.experience
      } experience. You currently have ${user.experience +
        monster.experience} experience.`;
      userRef.update({
        health: Math.ceil(user.health),
        experience: user.experience + monster.experience
      });
    } else {
      finalMessage = `${monster.name} has defeated you!`;
      if (user.experience - user.experience * 0.1 < 0) {
        userRef.update({
          health: 1,
          experience: 0
        });
      } else {
        userRef.update({
          health: 1,
          experience: user.experience - user.experienceNeeded * 0.1
        });
      }
    }
    res.send({
      record: battleRecord,
      win: win,
      finalMessage: finalMessage
    });
  }
};

exports.levelUp = async function(req, res, next) {
  let userRef = db.collection("adventurers").doc(req.body.user);
  let user = await userRef.get();
  user = user.data();
  if (user.experience >= user.experienceNeeded) {
    userRef.update({
      level: user.level + 1,
      experience: user.experience - user.experienceNeeded,
      experienceNeeded: Math.ceil(user.experienceNeeded * 2),
      [req.body.selectedStat]: Math.ceil(user[req.body.selectedStat] * 1.4)
    });
    res.send(
      `You have leveled up and increased your ${
        req.body.selectedStat
      }, you are now level ${user.level + 1} and your ${
        req.body.selectedStat
      } is now ${Math.ceil(user[req.body.selectedStat] * 1.4)}`
    );
  } else {
    res.send(
      `You don't have enough experience to level up, you need ${user.experienceNeeded -
        user.experience} more experience to level up`
    );
  }
};

exports.buy = function(req, res, next) {
  let userRef = db.collection("adventurers").doc(req.body.user);
  let storeRef = db.collection("store").doc(req.body.store);
  userRef
    .get()
    .then(stats => {
      if (stats.exists) {
        if (req.body.item.cost <= stats.data().gold) {
          userRef.update({ gold: stats.data().gold() - req.body.item.cost });
          userRef.collection("inventory").add(req.body.item);
          res.send(`You have purchased ${req.body.item.name}`);
        } else {
          res.send(
            `You don't have enough gold to purchase ${req.body.item.name}`
          );
        }
      } else {
        res.send("This character hasn't been created yet");
      }
    })
    .catch(error => {
      console.log(error);
    });
};

exports.sell = function(req, res, next) {
  let userRef = db.collection("adventurers").doc(req.body.user);
  userRef.get().then(stats => {
    if (userRef.collection("inventory").doc(req.body.item.name)) {
      userRef.update({ gold: (stats.data().gold += req.body.item.value) });
      userRef
        .collection("inventory")
        .doc(req.body.item.name)
        .delete();
      res.send(
        `You have sold your ${req.body.item.name} for ${req.body.item.value}`
      );
    } else {
    }
  });
};

exports.createMonster = async function(req, res) {
  let userRef = db.collection("adventurers").doc(req.body.user);
  let user = await userRef.get();
  if (user.exists && user.level >= 10) {
    if (
      req.body.monster.health + req.body.monster.attack > user.level || //User cannot allocate more points than their level to attack + health
      req.body.monster.attack + req.body.monster.health < user.level * 0.9 || //User must allocate points equal to atleast 90% of their level to health and attack
      req.body.monster.attack > req.body.monster.health * 5 || //attack can not be greater than 5 times the health
      req.body.monster.health > req.body.monster.attack * 5 || //health can not be greater than 5 times the attack
      req.body.monster.experience + req.body.monster.gold > user.level || // User cannot allocate more points than their level to gold + experience
      req.body.monster.experience + req.body.monster.gold < user.level * 0.9 || //User must allocate points equal to atleast 90% of their level to experience and gold
      req.body.monster.experience > req.body.monster.health * 5 || //experience cannot be greater than 5 times monster health
      req.body.monster.health > req.body.monster.experience * 5 //health cannot be greater than 5 times monster experience
    ) {
      res.send(
        "Invalid monster stats, please see the rules on monster creation"
      );
    } else {
      let monsterRef = db.collection("monsters").doc(req.monster.name);
      let setMonster = monsterRef.set({
        name: req.body.monster.name,
        attack: req.body.monster.attack,
        health: req.body.monster.health,
        experience: req.body.monster.experience,
        gold: req.body.monster.gold,
        createdBy: req.body.user
      });
      res.send(
        `${user.name} has created the level ${user.level} monster: ${
          req.monster.name
        }`
      );
    }
  } else {
    res.send("This character hasn't been created yet");
  }
};
