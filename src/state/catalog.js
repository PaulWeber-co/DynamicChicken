/** Klamotten, Pflege, Preise. Alles in Körnern (der Währung). */

/** Pflegeaktionen, die nichts kosten außer Zeit. */
export const CARE_ACTIONS = {
  wash:  { icon: 'careWash',   label: 'Waschen',  clean: 62, joy: 5,   energy: -4, xp: 6, cooldown: 90_000, fx: 'pop',   act: 'wash',      line: 'frisch gebadet' },
  sleep: { icon: 'careSleep',  label: 'Schlafen', energy: 0, xp: 4,                        cooldown: 0,      fx: 'cluck', act: 'nod',       line: 'schlummert' },
  play:  { icon: 'carePlay',   label: 'Spielen',  joy: 22, energy: -12, xp: 9, cooldown: 45_000, fx: 'yay',   act: 'dance',     line: 'hat getobt' },
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
  { level: 14, icon: 'hatHalo',       label: 'Heiligenschein', grants: { hat: 'halo' } },
  { level: 17, icon: 'accWings',      label: 'Engelsflügel',   grants: { acc: 'wings' } },
  { level: 20, icon: 'hatCrownDark',  label: 'Dunkle Krone',   grants: { hat: 'crownDark' } },
  { level: 24, icon: 'accBoa',        label: 'Federboa',       grants: { acc: 'boa' } },
  { level: 28, icon: 'hatViking',     label: 'Wikingerhelm',   grants: { hat: 'viking' } }
];
