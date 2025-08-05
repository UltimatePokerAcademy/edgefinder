/**
 * Export Format Utilities
 * Handles generation of different export formats for poker hands
 */

import { getReadableAction, groupActionsByStreet } from './handAnalysis';

/**
 * Get display name for export format
 * @param {string} format - Format identifier
 * @returns {string} Human-readable format name
 */
export const getFormatName = (format) => {
  const names = {
    'text': 'Text Summary',
    'hand_history': 'Hand History',
    'json': 'JSON Data',
    'gto_wizard': 'GTO Wizard',
    'pio_solver': 'PIOSolver',
    'simple_postflop': 'Simple Postflop',
    'monker_solver': 'MonkerSolver',
    'gto_plus': 'GTO+',
    'solver_plus': 'Solver+',
    'pokerstars': 'PokerStars Hand History',
    'ggpoker': 'GGPoker Format',
    'partypoker': 'PartyPoker Format',
    '888poker': '888poker Format',
    'generic_hh': 'Generic Hand History',
    'pt4': 'PokerTracker 4',
    'hm3': 'Hold\'em Manager 3'
  };
  return names[format] || format;
};

/**
 * Helper function to get position seat number
 * @param {string} position - Position name
 * @returns {number} Seat number
 */
export const getPositionSeat = (position) => {
  const seatMap = { 'SB': 1, 'BB': 2, 'UTG': 3, 'MP': 4, 'CO': 5, 'BTN': 6 };
  return seatMap[position] || 1;
};

/**
 * Helper function to get button position
 * @param {Object} handData - Hand data
 * @returns {string} Button position
 */
export const getButtonPosition = (handData) => {
  return handData.activePositions?.[handData.activePositions.length - 1] || 'BTN';
};

/**
 * Generate base export data structure
 * @param {Object} handData - Complete hand data
 * @param {Array} selectedTags - Selected tags
 * @param {string} summaryNotes - Summary notes
 * @param {string} lessonsLearned - Lessons learned
 * @returns {Object} Base export data
 */
export const generateBaseExportData = (handData, selectedTags, summaryNotes, lessonsLearned) => {
  return {
    handId: handData.handId || `EDGE_${Date.now()}`,
    timestamp: handData.dateCreated || new Date().toISOString(),
    stakes: handData.stakeLevel || '',
    heroPosition: handData.heroPosition || '',
    heroCards: handData.heroCards || [],
    board: [
      ...(handData.flopCards || []),
      ...(handData.turnCard ? [handData.turnCard] : []),
      ...(handData.riverCard ? [handData.riverCard] : [])
    ],
    actions: [
      ...(handData.preflopActions || []),
      ...(handData.flopActions || []),
      ...(handData.turnActions || []),
      ...(handData.riverActions || [])
    ],
    result: handData.handResult || '',
    amountWon: handData.amountWon || 0,
    potSize: handData.potSize || 0,
    tags: selectedTags,
    summaryNotes,
    lessonsLearned
  };
};

/**
 * Generate text summary format
 * @param {Object} data - Base export data
 * @returns {string} Text summary
 */
export const generateTextSummary = (data) => {
  return `HAND SUMMARY
===============
Hand ID: ${data.handId}
Stakes: ${data.stakes}
Position: ${data.heroPosition}
Hero Cards: ${data.heroCards.join(' ')}
Board: ${data.board.join(' ')}
Result: ${data.result}
Amount Won: ${data.amountWon}
Final Pot: ${data.potSize}

Tags: ${data.tags.join(', ')}
Notes: ${data.summaryNotes}
Lessons: ${data.lessonsLearned}`;
};

/**
 * Generate generic hand history format
 * @param {Object} data - Base export data
 * @param {Object} handData - Original hand data for additional context
 * @returns {string} Hand history text
 */
export const generateHandHistory = (data, handData) => {
  let hh = `Hand #${data.handId} - ${data.stakes} - ${new Date(data.timestamp).toLocaleString()}\n`;
  hh += `Table: Edgefinder Analysis\n`;
  hh += `Seat ${getPositionSeat(data.heroPosition)}: Hero (${handData.effectiveStack || 100})\n\n`;
  
  hh += `*** HOLE CARDS ***\n`;
  hh += `Dealt to Hero [${data.heroCards.join(' ')}]\n\n`;
  
  // Add action history
  const actionsByStreet = groupActionsByStreet(data.actions);
  
  if (actionsByStreet.preflop.length > 0) {
    hh += `*** PREFLOP ***\n`;
    actionsByStreet.preflop.forEach(action => {
      hh += `${formatActionForHH(action, data.heroPosition)}\n`;
    });
    hh += `\n`;
  }
  
  if (data.board.length >= 3) {
    hh += `*** FLOP *** [${data.board.slice(0, 3).join(' ')}]\n`;
    actionsByStreet.flop.forEach(action => {
      hh += `${formatActionForHH(action, data.heroPosition)}\n`;
    });
    hh += `\n`;
  }
  
  if (data.board.length >= 4) {
    hh += `*** TURN *** [${data.board.slice(0, 3).join(' ')}] [${data.board[3]}]\n`;
    actionsByStreet.turn.forEach(action => {
      hh += `${formatActionForHH(action, data.heroPosition)}\n`;
    });
    hh += `\n`;
  }
  
  if (data.board.length >= 5) {
    hh += `*** RIVER *** [${data.board.slice(0, 4).join(' ')}] [${data.board[4]}]\n`;
    actionsByStreet.river.forEach(action => {
      hh += `${formatActionForHH(action, data.heroPosition)}\n`;
    });
    hh += `\n`;
  }
  
  hh += `*** SUMMARY ***\n`;
  hh += `Total pot: ${data.potSize}\n`;
  hh += `Hero ${data.result} ${Math.abs(data.amountWon)} ${data.amountWon >= 0 ? '' : '(lost)'}\n`;
  
  return hh;
};

/**
 * Format action for hand history
 * @param {Object} action - Action object
 * @param {string} heroPosition - Hero's position
 * @returns {string} Formatted action
 */
export const formatActionForHH = (action, heroPosition) => {
  const name = action.position === heroPosition ? 'Hero' : action.position;
  return `${name}: ${getReadableAction(action)}`;
};

/**
 * Generate GTO Wizard format
 * @param {Object} data - Base export data
 * @param {Array} handStrengthProgression - Hand strength progression
 * @returns {string} GTO Wizard JSON format
 */
export const generateGTOWizardFormat = (data, handStrengthProgression) => {
  return JSON.stringify({
    version: "1.0",
    hand: {
      id: data.handId,
      game_type: "NLHE",
      stakes: data.stakes,
      max_players: 6,
      hero_position: data.heroPosition,
      hero_cards: data.heroCards,
      board: data.board,
      actions: data.actions.map(action => ({
        position: action.position,
        action: action.type,
        amount: action.amount || 0,
        street: action.street
      })),
      pot_size: data.potSize,
      rake: 0
    },
    analysis: {
      hand_strength: handStrengthProgression?.[handStrengthProgression.length - 1]?.strength || '',
      tags: data.tags,
      notes: data.summaryNotes
    }
  }, null, 2);
};

/**
 * Generate PIOSolver format
 * @param {Object} data - Base export data
 * @param {Object} handData - Original hand data
 * @returns {string} PIOSolver format
 */
export const generatePIOSolverFormat = (data, handData) => {
  return `# PIOSolver Hand Import
# Generated by Edgefinder

Game: NLHE
Stakes: ${data.stakes}
Players: 6
Button: ${getButtonPosition(handData)}

Cards:
Hero: ${data.heroCards.join('')}
Board: ${data.board.join('')}

Betting:
${formatPIOBetting(data.actions)}

Pot: ${data.potSize}
Result: ${data.result}
`;
};

/**
 * Format actions for PIOSolver
 * @param {Array} actions - Action array
 * @returns {string} Formatted actions
 */
export const formatPIOBetting = (actions) => {
  return actions.map(action => 
    `${action.position}: ${action.type}${action.amount ? ` ${action.amount}` : ''}`
  ).join('\n');
};

/**
 * Generate Simple Postflop format
 * @param {Object} data - Base export data
 * @param {Object} handData - Original hand data
 * @returns {string} Simple Postflop format
 */
export const generateSimplePostflopFormat = (data, handData) => {
  const postflopBoard = data.board.slice(0, 3).join('');
  const turn = data.board[3] || '';
  const river = data.board[4] || '';
  
  return `# Simple Postflop Format
Range1: ${data.heroCards.join('')}
Range2: random
Board: ${postflopBoard}${turn}${river}
Pot: ${data.potSize}
EffectiveStack: ${handData.effectiveStack || 100}
Position: ${data.heroPosition}
`;
};

/**
 * Generate MonkerSolver format
 * @param {Object} data - Base export data
 * @param {Object} handData - Original hand data
 * @returns {string} MonkerSolver format
 */
export const generateMonkerSolverFormat = (data, handData) => {
  return `# MonkerSolver Hand
Version: 1.0
Game: NLHE
Stakes: ${data.stakes}

Stacks:
Hero: ${handData.effectiveStack || 100}

Cards:
Hero: ${data.heroCards.join('')}
Board: ${data.board.join('')}

Actions:
${formatMonkerActions(data.actions)}

Pot: ${data.potSize}
`;
};

/**
 * Format actions for MonkerSolver
 * @param {Array} actions - Action array
 * @returns {string} Formatted actions
 */
export const formatMonkerActions = (actions) => {
  return actions.map(action => 
    `${action.street}: ${action.position} ${action.type}${action.amount ? ` ${action.amount}` : ''}`
  ).join('\n');
};

/**
 * Generate GTO+ format
 * @param {Object} data - Base export data
 * @param {Object} handData - Original hand data
 * @returns {string} GTO+ format
 */
export const generateGTOPlusFormat = (data, handData) => {
  return `# GTO+ Hand Analysis
[GAME]
Type=NLHE
Stakes=${data.stakes}
MaxPlayers=6

[POSITIONS]
Hero=${data.heroPosition}
Button=${getButtonPosition(handData)}

[CARDS]
Hero=${data.heroCards.join('')}
Board=${data.board.join('')}

[ACTIONS]
${formatGTOPlusActions(data.actions)}

[RESULT]
Pot=${data.potSize}
Winner=${data.result}
Amount=${data.amountWon}
`;
};

/**
 * Format actions for GTO+
 * @param {Array} actions - Action array
 * @returns {string} Formatted actions
 */
export const formatGTOPlusActions = (actions) => {
  return actions.map(action => 
    `${action.street}|${action.position}|${action.type}|${action.amount || 0}`
  ).join('\n');
};

/**
 * Generate Solver+ format
 * @param {Object} data - Base export data
 * @param {Object} handData - Original hand data
 * @returns {string} Solver+ JSON format
 */
export const generateSolverPlusFormat = (data, handData) => {
  return JSON.stringify({
    solver: "SolverPlus",
    version: "2.0",
    hand_data: {
      game: "NLHE",
      stakes: data.stakes,
      effective_stack: handData.effectiveStack || 100,
      positions: {
        hero: data.heroPosition,
        button: getButtonPosition(handData)
      },
      cards: {
        hero: data.heroCards,
        board: data.board
      },
      action_sequence: data.actions,
      pot_size: data.potSize,
      result: {
        winner: data.result,
        amount: data.amountWon
      }
    },
    metadata: {
      tags: data.tags,
      notes: data.summaryNotes,
      timestamp: data.timestamp
    }
  }, null, 2);
};

/**
 * Generate PokerStars format
 * @param {Object} data - Base export data
 * @param {Object} handData - Original hand data
 * @returns {string} PokerStars hand history
 */
export const generatePokerStarsFormat = (data, handData) => {
  return `PokerStars Hand #${data.handId}: Hold'em No Limit (${handData.smallBlind || 0.5}/${handData.bigBlind || 1}) - ${new Date(data.timestamp).toISOString()}
Table 'Edgefinder Analysis' 6-max Seat #1 is the button
Seat ${getPositionSeat(data.heroPosition)}: Hero (${handData.effectiveStack || 100} in chips)

*** HOLE CARDS ***
Dealt to Hero [${data.heroCards.join(' ')}]
${formatPokerStarsActions(data.actions, data.heroPosition)}

*** SUMMARY ***
Total pot ${data.potSize}
Board [${data.board.join(' ')}]
Seat ${getPositionSeat(data.heroPosition)}: Hero ${data.result === 'won' ? 'won' : 'lost'} (${Math.abs(data.amountWon)})
`;
};

/**
 * Format actions for PokerStars
 * @param {Array} actions - Action array
 * @param {string} heroPosition - Hero position
 * @returns {string} Formatted actions
 */
export const formatPokerStarsActions = (actions, heroPosition) => {
  return actions.map(action => {
    const name = action.position === heroPosition ? 'Hero' : action.position;
    return `${name}: ${getReadableAction(action)}`;
  }).join('\n');
};

/**
 * Generate PokerTracker 4 format
 * @param {Object} data - Base export data
 * @param {Object} handData - Original hand data
 * @returns {string} PT4 JSON format
 */
export const generatePokerTracker4Format = (data, handData) => {
  return JSON.stringify({
    software: "PokerTracker4",
    version: "4.0",
    hand: {
      id: data.handId,
      timestamp: data.timestamp,
      game_type: "NLHE",
      limit_type: "NL",
      stakes: data.stakes,
      table_name: "Edgefinder Analysis",
      max_seats: 6,
      button_seat: 1,
      hero_seat: getPositionSeat(data.heroPosition),
      hero_cards: data.heroCards,
      board_cards: data.board,
      actions: data.actions,
      pot_size: data.potSize,
      rake: 0,
      hero_result: data.amountWon
    },
    stats: {
      vpip: null,
      pfr: null,
      aggression_factor: null,
      wtsd: null
    },
    notes: data.summaryNotes,
    tags: data.tags
  }, null, 2);
};

/**
 * Generate Hold'em Manager 3 format
 * @param {Object} data - Base export data
 * @param {Object} handData - Original hand data
 * @returns {string} HM3 XML format
 */
export const generateHoldemManager3Format = (data, handData) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<holdem_manager_hand>
  <hand_info>
    <hand_id>${data.handId}</hand_id>
    <timestamp>${data.timestamp}</timestamp>
    <game_type>NLHE</game_type>
    <stakes>${data.stakes}</stakes>
    <table_name>Edgefinder Analysis</table_name>
    <max_players>6</max_players>
  </hand_info>
  
  <hero>
    <position>${data.heroPosition}</position>
    <cards>${data.heroCards.join(' ')}</cards>
    <stack>${handData.effectiveStack || 100}</stack>
    <result>${data.amountWon}</result>
  </hero>
  
  <board>
    <cards>${data.board.join(' ')}</cards>
  </board>
  
  <actions>
    ${data.actions.map(action => 
      `<action position="${action.position}" type="${action.type}" amount="${action.amount || 0}" street="${action.street}"/>`
    ).join('\n    ')}
  </actions>
  
  <summary>
    <pot_size>${data.potSize}</pot_size>
    <winner>${data.result}</winner>
  </summary>
  
  <notes>${data.summaryNotes}</notes>
  <tags>${data.tags.join(',')}</tags>
</holdem_manager_hand>`;
};