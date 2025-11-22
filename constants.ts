

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
export const BOSS_HEALTH_BASE = 5;

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
  boss: '👹', 
  finalBoss: '🤬',
  taco: '🌮',
  sauce: '🌶️',
  coffee: '☕',
  fire: '🔥',
  explosion: '💥'
};

// Level Design Key:
// # = Platform
// S = Start
// T = Taco (Goal) 
// O = Onion
// C = Cilantro
// A = Salt
// H = Hot Sauce
// E = Espresso (Run Powerup)
// B = Boss

// --- WORLD 1: PREP STATION (Basic) ---

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
  "      #        #   E                         #                      ",
  "  S   #  C     #  ###                       #                       ",
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
  "               #      #           E                                 ",
  "              #      #   C       ###                                ",
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
  "     ###  #      E      #    #             ##            #          ",
  "         #      ###      #  #                           #           ",
  "  S     #                 ##                           #            ",
  "#####  #                                              #             ",
  "#######                                              ###############"
];

const LEVEL_4_BOSS = [
  "                                                                    ",
  "                                                                    ",
  "                                                                    ",
  "                                                                    ",
  "                                                                    ",
  "                                                                    ",
  "                                                                    ",
  "                                                                    ",
  "                  H                     B                           ",
  "                 ###                                                ",
  "                                                                    ",
  "              #   E                                                  ",
  "  S              ###                                                ",
  "#####      ##########################################      #########",
  "####################################################################"
];

// --- WORLD 2: THE FRYER (Salt & Verticality) ---

const LEVEL_5 = [
  " T                                                                  ",
  "###                                                                 ",
  "   #                                                                ",
  "    #          A              A              A                      ",
  "     #        ###            ###            ###                     ",
  "      #      #   #          #   #          #   #                    ",
  "       #    #     #        #     #        #     #                   ",
  "        #  #       #      #       #      #       #                  ",
  "         ##         #    #         #    #         #                 ",
  "                     #  #           #  #           #                ",
  "     ###              ##             ##                             ",
  "           H                                         #              ",
  "          ###                                       #               ",
  "  S               E                                 #                ",
  "#####            ###                              #      ###        ",
  "####################################################################"
];

const LEVEL_6 = [
  "                                                                   T",
  "                                                                  ##",
  "                                                           O     #  ",
  "                                                          ###   #   ",
  "                                              A          #     #    ",
  "                                             ###        #     #     ",
  "                                  A         #          #     #      ",
  "                                 ###       #          #     #       ",
  "                      A         #         #          #     #        ",
  "                     ###       #         #          #     #         ",
  "          H         #         #         #          #     #          ",
  "         ###       #    E    #         #          #     #           ",
  "                  #    ###  #         #          #     #            ",
  "  S              #         #         #          #     #             ",
  "#####           #         #         #          #     #              ",
  "####################################################################"
];

const LEVEL_7 = [
  "      T                                                             ",
  "     ###                                                            ",
  "    #   #                                                           ",
  "   #     #                                                          ",
  "  #       #             A                 A                O        ",
  " #         #           ###               ###              ###       ",
  "#           #         #   #             #   #            #   #      ",
  "                     #     #           #     #          #     #     ",
  "              #     #       #         #       #        #       #    ",
  "               #   #         #   H   #         #      #         #   ",
  "                # #           ##### #           #    #           #  ",
  "                 #                 #             #  #               ",
  "  S                   ###                        ###                ",
  "#####                              E                              # ",
  "#####      ####  ##         ###   ###       ##########     ###   #  ",
];

const LEVEL_8_BOSS = [
  "                                                                    ",
  "                                                                    ",
  "                                                                    ",
  "                                                                    ",
  "                       B                                            ",
  "                                                                    ",
  "                ###         ###                                     ",
  "                                                                    ",
  "         H                                                          ",
  "        ###                                                         ",
  "                                                                    ",
  "                                  E                                 ",
  "  S                              ###                                ",
  "#####     ###     ###     ###     ###     ###     ###     ##########",
  "####################################################################"
];

// --- WORLD 3: THE WALK-IN (Cilantro & Gaps) ---

const LEVEL_9 = [
  "                                                                   T",
  "                                                                 ###",
  "                                                                #   ",
  "                                                     C         #    ",
  "                                                    ###       #     ",
  "                                          C        #         #      ",
  "                                         ###      #         #       ",
  "                                C       #        #         #        ",
  "                               ###     #        #         #         ",
  "                      C       #       #        #         #          ",
  "                     ###     #       #        #         #           ",
  "            H       #       #   E   #        #         #            ",
  "           ###     #       #   ### #        #         #             ",
  "  S               #       #       #        #         #              ",
  "#####            #       #       #        #         #               ",
  "#######         ####################################################"
];

const LEVEL_10 = [
  "T                                                                   ",
  "#                                                                   ",
  " #                                                                  ",
  "  #         C       C       C       C       C       C               ",
  "   #       ###     ###     ###     ###     ###     ###              ",
  "    #                                                               ",
  "     #                                                              ",
  "      #                                                             ",
  "       #                                                            ",
  "        #       C       C       C       C       C                   ",
  "         #     ###     ###     ###     ###     ###                  ",
  "          #                                                         ",
  "           #                                                        ",
  "            #        H                                              ",
  "  S          #      ###               E                             ",
  "#####         #                      ###                            "
];

const LEVEL_11 = [
  "                                                                   T",
  "                                                                  ##",
  "                                                                 #  ",
  "                                                        O       #   ",
  "                                                       ###     #    ",
  "                                            C         #       #     ",
  "                                           ###       #       #      ",
  "                                A         #         #       #       ",
  "                               ###       #         #       #        ",
  "                     O        #         #         #       #         ",
  "                    ###      #         #         #       #          ",
  "           C       #        #         #         #       #           ",
  "          ###     #        #         #         #       #            ",
  "  S      #       #    E   #         #         #       #             ",
  "#####   #       #    ### #         #         #       #              ",
  "####### #      #        #         #         #       #               "
];

const LEVEL_12_BOSS = [
  "                                                                    ",
  "                                                                    ",
  "                                                                    ",
  "                     B                                              ",
  "                                                                    ",
  "                  #####                                             ",
  "                                                                    ",
  "               #         #                                          ",
  "                                                                    ",
  "             #             #                                        ",
  "                                                                    ",
  "      H    #                 #                  E                   ",
  "     ###                                       ###                  ",
  "  S                                                                 ",
  "#######   #                   #   ##################################",
  "####################################################################"
];

// --- WORLD 4: THE PASS (The Gauntlet) ---

const LEVEL_13 = [
  "                                                                   T",
  "                                                                  ##",
  "                                                                 #  ",
  "                                                            C    #  ",
  "                                                           ###  #   ",
  "                                                      A   #    #    ",
  "                                                     ### #    #     ",
  "                                                O   #   #    #      ",
  "                                               ### #   #    #       ",
  "                                          C   #   #   #    #        ",
  "                                         ### #   #   #    #         ",
  "                                    A   #   #   #   #    #          ",
  "                                   ### #   #   #   #    #           ",
  "                              H   #   #   #   #   #    #            ",
  "  S          E               ### #   #   #   #   #    #             ",
  "#####       ###                 #   #   #   #   #    #              ",
  "#######                        #   #   #   #   #    #               "
];

const LEVEL_14 = [
  "T                                                                   ",
  "#                                                                   ",
  " #       C               O               A               C          ",
  "  #     ###             ###             ###             ###         ",
  "   #           C               O               A                    ",
  "    #         ###             ###             ###                   ",
  "     #               C               O               A              ",
  "      #             ###             ###             ###             ",
  "       #                   C               O                        ",
  "        #                 ###             ###                       ",
  "         #                       C                                  ",
  "          #                     ###                                 ",
  "           #          H                                             ",
  "            #        ###            E                               ",
  "  S          #                     ###                              ",
  "#####         #                                                     "
];

const LEVEL_15 = [
  "                                                                   T",
  "                                                                  ##",
  "                                                                 #  ",
  "                                                          C     #   ",
  "                                                         ###   #    ",
  "                                                  O     #     #     ",
  "                                                 ###   #     #      ",
  "                                          A     #     #     #       ",
  "                                         ###   #     #     #        ",
  "                                  C     #     #     #     #         ",
  "                                 ###   #     #     #     #          ",
  "                          O     #     #     #     #     #           ",
  "                         ###   #     #     #     #     #            ",
  "                  A     #     #     #     #     #     #             ",
  "  S        H     ###   #     #     #     #     #     #              ",
  "#####     ###   #     #     #     #     #     #     #               "
];

const LEVEL_16_FINAL_BOSS = [
  "                                                                    ",
  "                                                                    ",
  "                                                                    ",
  "                                                                    ",
  "                         B                                          ",
  "                                                                    ",
  "                                                                    ",
  "                 #   #   #   #   #                                  ",
  "                                                                    ",
  "                                                                    ",
  "       H                                                            ",
  "      ###                        E                                  ",
  "                                ###                                 ",
  "  S                                                                 ",
  "#########   #   #   #   #   #   #   #   #   #   #   #   ############",
  "####################################################################"
];

export const LEVELS = [
  LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4_BOSS,
  LEVEL_5, LEVEL_6, LEVEL_7, LEVEL_8_BOSS,
  LEVEL_9, LEVEL_10, LEVEL_11, LEVEL_12_BOSS,
  LEVEL_13, LEVEL_14, LEVEL_15, LEVEL_16_FINAL_BOSS
];

export const CHEF_QUOTES_VICTORY = [
  "Finally, some decent food. Don't get cocky.",
  "Acceptable. Just barely.",
  "The plating was messy, but the flavor is there.",
  "You didn't ruin it. Incredible.",
  "I've seen worse from a line cook. Good job.",
  "Surprisingly adequate.",
  "It's raw! Oh wait, no, it's actually perfect. My mistake.",
  "Delicious. Finally, some good food."
];

export const CHEF_QUOTES_FAILURE = [
  "You call that cooking? You're just falling off ledges!",
  "My gran could jump better than that, and she's a ghost!",
  "Defeated by {{cause}}? You are an idiot sandwich!",
  "Get out! You're a disgrace to the uniform!",
  "Overcooked and underwhelming. Just like your jumping.",
  "Focus! You're letting the ingredients win!",
  "Pathetic. Absolutely pathetic. Killed by {{cause}}.",
  "Where is the lamb sauce?! You have nothing!"
];
