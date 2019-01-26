var materials = [
  {
    name: "rock",
    value: 10,
    rarity: 0
  },
  {
    name: "steel",
    value: 50,
    rarity: 700
  },
  {
    name: "ruby",
    value: 150,
    rarity: 850
  },
  {
    name: "diamond",
    value: 500,
    rarity: 950
  },
]

function getItem(){
  let chance = Math.random() * 1000;
  for (let i = 0; i < materials.length; i++) {
    if (materials[i].rarity < chance) {
      if (i === materials.length - 1) {
        return materials[i];
      } else {
        continue;
      }
    } else {
      if (i === 0) {
        return null;
      } else {
        return materials[i - 1];
      }
    }
  }
}

module.exports.getItem = getItem;materials