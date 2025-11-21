
export const GRAVITY = 0.6;
export const FRICTION = 0.85;

// Movement Constants
export const WALK_SPEED = 1.0; // Acceleration
export const WALK_MAX_SPEED = 7;
export const WALK_JUMP_FORCE = -14;

export const RUN_SPEED = 1.5; // Faster acceleration
export const RUN_MAX_SPEED = 12;
export const RUN_JUMP_FORCE = -18; // Higher jump when running

export const TERMINAL_VELOCITY = 15;

export const TILE_SIZE = 48;
export const BOSS_HEALTH = 5;

export const COLORS = {
  sky: '#87CEEB',
  kitchenTile: '#f0f0f0',
  platform: '#5D4037',
  uiBg: 'rgba(0,0,0,0.8)',
};

export const EMOJIS = {
  player: '👨‍🍳',
  onion: '🧅',
  cilantro: '🌿',
  salt: '🧂',
  boss: '👹', // Or a giant onion
  taco: '🌮',
  sauce: '🌶️',
  fire: '🔥',
  explosion: '💥'
};

// Level Design Key:
// # = Platform
// S = Start
// T = Taco (Goal) - In Boss level, this spawns after Boss death
// O = Onion
// C = Cilantro
// A = Salt
// H = Hot Sauce
// B = Boss

const LEVEL_1 = [
  "                                                                    ",
  "                                                                    ",
  "                                                      T             ",
  "                                                     ###            ",
  "                                                    #               ",
  "                         H                         #                ",
  "                        ###                       #       A         ",
  "               #                                 #       ###        ",
  "           O   #   O                            #                   ",
  "          ###  #  ###                          #                    ",
  "               #                              #                     ",
  "      #        #                             #                      ",
  "  S   #  C     #                            #                       ",
  "##### # ###   #######    ######    ####### #                        ",
  "####################################################################"
];

const LEVEL_2 = [
  "                                T                                   ",
  "                               ###                                  ",
  "                              #                                     ",
  "                      A      #                                      ",
  "                     ###    #                                       ",
  "                    #      #                                        ",
  "                   #      #     O                                   ",
  "                  #      #     ###                                  ",
  "          H      #      #                                           ",
  "         ###    #      #                                            ",
  "               #      #                                             ",
  "              #      #   C                                          ",
  "      #      #      #   ###                                         ",
  "  S   #     #      #                                                ",
  "##### #    #      #                                                 ",
  "#######   #      ###################################################"
];

const LEVEL_3 = [
  "                                                                   T",
  "                                                                  ##",
  "                                                                 #  ",
  "                                                   O            #   ",
  "                                                  ###          #    ",
  "                 A                  A            #            #     ",
  "                ###                ###          #            #      ",
  "             #       #          #       #      #            #       ",
  "            #         #        #         #    #            #        ",
  "      H    #           #      #           #  #            #         ",
  "     ###  #             #    #             ##            #          ",
  "         #               #  #                           #           ",
  "  S     #                 ##                           #            ",
  "#####  #                                              #             ",
  "#######                                              ###############"
];

const LEVEL_BOSS = [
  "                                                                    ",
  "                                                                    ",
  "                                                                    ",
  "                                                                    ",
  "                                                                    ",
  "                                                                    ",
  "                                                                    ",
  "                                                                    ",
  "                  H                                                 ",
  "                 ###                                                ",
  "                                        B                           ",
  "                                                                    ",
  "  S                                                                 ",
  "#####      ##########################################      #########",
  "####################################################################"
];

export const LEVELS = [LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_BOSS];
