/** Futter, Klamotten, Preise. Alles in Körnern (der Währung). */

export const FOODS = [
  { id: 'korn',     icon: 'corn',     label: 'Korn',     price: 4,  full: 14, joy: 2,  energy: 1,  clean: 0,  line: 'Klassiker. Immer richtig.' },
  { id: 'wurm',     icon: 'worm',     label: 'Wurm',     price: 7,  full: 20, joy: 5,  energy: 2,  clean: -4, line: 'Proteinreich, leicht eklig.' },
  { id: 'beeren',   icon: 'berries',  label: 'Beeren',   price: 9,  full: 12, joy: 10, energy: 3,  clean: -1, line: 'Süß und gut für die Laune.' },
  { id: 'salat',    icon: 'salad',    label: 'Salat',    price: 6,  full: 16, joy: 1,  energy: 5,  clean: 1,  line: 'Vernünftig. Sehr vernünftig.' },
  { id: 'brot',     icon: 'bread',    label: 'Brot',     price: 5,  full: 18, joy: 3,  energy: 2,  clean: -2, line: 'Sättigt ordentlich.' },
  { id: 'smoothie', icon: 'smoothie', label: 'Smoothie', price: 14, full: 9,  joy: 7,  energy: 19, clean: 0,  line: 'Wachmacher mit Vitaminen.' },
  { id: 'kaffee',   icon: 'coffee',   label: 'Kaffee',   price: 12, full: 3,  joy: 4,  energy: 27, clean: 0,  line: 'Ein Huhn mit Koffein. Was soll schiefgehen.' },
  { id: 'suppe',    icon: 'soup',     label: 'Suppe',    price: 19, full: 26, joy: 12, energy: 9,  clean: 0,  line: 'Hilft, wenn es Knuddl nicht gut geht.' },
  { id: 'kuchen',   icon: 'cake',     label: 'Kuchen',   price: 17, full: 21, joy: 19, energy: 6,  clean: -5, line: 'Glück in Scheiben.' },
  { id: 'pizza',    icon: 'pizza',    label: 'Pizza',    price: 23, full: 34, joy: 15, energy: 4,  clean: -7, line: 'Ein ganzes Wochenende in einem Stück.' }
];

export const foodById = (id) => FOODS.find((f) => f.id === id);

/** Startinventar — damit man nie vor einem leeren Kühlschrank steht. */
export const STARTER_INVENTORY = { korn: 8, beeren: 3, brot: 2 };

/** Pflegeaktionen, die nichts kosten außer Zeit. */
export const CARE_ACTIONS = {
  wash:  { icon: 'careWash',   label: 'Waschen',  clean: 62, joy: 5,   energy: -4, xp: 6, cooldown: 90_000, fx: 'pop',   act: 'wash',      line: 'frisch gebadet' },
  sleep: { icon: 'careSleep',  label: 'Schlafen', energy: 0, xp: 4,                        cooldown: 0,      fx: 'cluck', act: 'nod',       line: 'schlummert' },
  play:  { icon: 'carePlay',   label: 'Spielen',  joy: 22, energy: -12, full: -6,  xp: 9, cooldown: 45_000, fx: 'yay',   act: 'dance',     line: 'hat getobt' },
  cuddle:{ icon: 'careCuddle', label: 'Knuddeln', joy: 16, energy: 3,               xp: 7, cooldown: 20_000, fx: 'love',  act: 'hop',       line: 'wurde geknuddelt' }
};

/** Belohnungen. Absichtlich großzügig — das hier ist kein Grind. */
export const REWARDS = {
  gamePlayed: 6,
  gameWon: 18,
  gameDraw: 10,
  dailyBoth: 25,
  nudgeSent: 2,
  nudgeGot: 3,
  careDaily: 12,
  streakDay: 8,
  levelUp: 30
};

/** Freischaltungen nach Bond-Level — kleine Ziele für lange Distanzen. */
export const BOND_UNLOCKS = [
  { level: 2,  icon: 'accBowtie',     label: 'Fliege',         grants: { acc: 'bowtie' } },
  { level: 3,  icon: 'accScarf',      label: 'Schal',          grants: { acc: 'scarf' } },
  { level: 5,  icon: 'hatCrown',      label: 'Krönchen',       grants: { hat: 'crown' } },
  { level: 7,  icon: 'accHeadphones', label: 'Kopfhörer',      grants: { acc: 'headphones' } },
  { level: 10, icon: 'accNecklace',   label: 'Herzkette',      grants: { acc: 'necklace' } },
  { level: 14, icon: 'hatHalo',       label: 'Heiligenschein', grants: { hat: 'halo' } }
];
