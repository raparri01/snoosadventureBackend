var weapons = [
  {
    name: "Just a regular Sword",
    damage: 5,
    value: 6,
    description: "It ain't much but it's honest work",
    rarity: 200
  },
  {
    name: "Pitchfork",
    damage: 10,
    value: 15,
    description: "Karma Court is in session",
    rarity: 700
  },
  {
    name: "The Arm Breaker",
    damage: 30,
    value: 50,
    description: "You don't want any part of this",
    rarity: 900
  }
]

function getItem(){
  let chance = Math.random() * 1000;
  for (let i = 0; i < weapons.length; i++) {
    if (weapons[i].rarity < chance) {
      if (i === weapons.length - 1) {
        return weapons[i];
      } else {
        continue;
      }
    } else {
      if (i === 0) {
        return null;
      } else {
        return weapons[i - 1];
      }
    }
  }
}

module.exports.getItem = getItem;