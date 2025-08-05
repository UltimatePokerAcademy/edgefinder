/**
 * Hand Analysis Utilities
 * Shared functions for analyzing poker hands and calculating statistics
 */

/**
 * Calculate how much the hero contributed to the pot across all streets
 * @param {Array} allActions - All actions from all streets
 * @param {string} heroPosition - Hero's position
 * @returns {number} Total amount hero contributed
 */
export const calculateHeroContribution = (allActions, heroPosition) => {
  if (!allActions || !heroPosition) return 0;
  
  return allActions
    .filter(action => action.position === heroPosition)
    .reduce((total, action) => {
      if (['bet', 'call', 'raise', 'post_blind', 'post_straddle', 'all_in'].includes(action.type)) {
        return total + (action.amount || 0);
      }
      return total;
    }, 0);
};

/**
 * Calculate basic hand strength from 5+ cards
 * @param {Array} cards - Array of card strings like ['As', 'Kh', ...]
 * @returns {Object} {strength: string, rank: number}
 */
export const calculateHandStrength = (cards) => {
  if (!cards || cards.length < 5) {
    return { strength: 'Incomplete', rank: 0 };
  }

  const ranks = cards.map(card => card[0]);
  const suits = cards.map(card => card[1]);
  
  // Count rank frequencies
  const rankCounts = {};
  ranks.forEach(rank => {
    rankCounts[rank] = (rankCounts[rank] || 0) + 1;
  });
  
  const counts = Object.values(rankCounts).sort((a, b) => b - a);
  
  // Check for flush
  const suitCounts = {};
  suits.forEach(suit => {
    suitCounts[suit] = (suitCounts[suit] || 0) + 1;
  });
  const maxSuitCount = Math.max(...Object.values(suitCounts));
  const isFlush = maxSuitCount >= 5;
  
  // Check for straight (simplified)
  const rankValues = {
    'A': 14, 'K': 13, 'Q': 12, 'J': 11, 'T': 10,
    '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
  };
  
  const uniqueRankValues = [...new Set(ranks.map(r => rankValues[r]))].sort((a, b) => b - a);
  const isStraight = checkStraight(uniqueRankValues);
  
  // Hand ranking logic
  if (isStraight && isFlush) {
    if (uniqueRankValues[0] === 14) return { strength: 'Royal Flush', rank: 10 };
    return { strength: 'Straight Flush', rank: 9 };
  }
  if (counts[0] === 4) return { strength: 'Four of a Kind', rank: 8 };
  if (counts[0] === 3 && counts[1] === 2) return { strength: 'Full House', rank: 7 };
  if (isFlush) return { strength: 'Flush', rank: 6 };
  if (isStraight) return { strength: 'Straight', rank: 5 };
  if (counts[0] === 3) return { strength: 'Three of a Kind', rank: 4 };
  if (counts[0] === 2 && counts[1] === 2) return { strength: 'Two Pair', rank: 3 };
  if (counts[0] === 2) return { strength: 'One Pair', rank: 2 };
  
  return { strength: 'High Card', rank: 1 };
};

/**
 * Check if rank values form a straight
 * @param {Array} sortedValues - Sorted rank values (high to low)
 * @returns {boolean}
 */
const checkStraight = (sortedValues) => {
  if (sortedValues.length < 5) return false;
  
  // Check for regular straight
  for (let i = 0; i <= sortedValues.length - 5; i++) {
    let consecutive = true;
    for (let j = 0; j < 4; j++) {
      if (sortedValues[i + j] - sortedValues[i + j + 1] !== 1) {
        consecutive = false;
        break;
      }
    }
    if (consecutive) return true;
  }
  
  // Check for wheel (A-5 straight)
  if (sortedValues.includes(14) && sortedValues.includes(5) && 
      sortedValues.includes(4) && sortedValues.includes(3) && sortedValues.includes(2)) {
    return true;
  }
  
  return false;
};

/**
 * Get hand strength progression through streets
 * @param {Object} handData - Complete hand data
 * @returns {Array|null} Array of progression objects or null
 */
export const getHandStrengthProgression = (handData) => {
  const heroCards = handData.heroCards || [];
  if (heroCards.length < 2) return null;

  const progression = [];
  
  // Preflop strength
  progression.push({
    street: 'Preflop',
    cards: heroCards,
    strength: 'Hole Cards',
    description: `${heroCards.join('')} in ${handData.heroPosition || 'Unknown'} position`
  });

  // Flop strength
  if (handData.flopCards && handData.flopCards.length === 3) {
    const flopStrength = calculateHandStrength([...heroCards, ...handData.flopCards]);
    progression.push({
      street: 'Flop',
      cards: [...heroCards, ...handData.flopCards],
      strength: flopStrength.strength,
      description: `Made ${flopStrength.strength} on the flop`
    });
  }

  // Turn strength
  if (handData.turnCard && handData.flopCards) {
    const turnStrength = calculateHandStrength([...heroCards, ...handData.flopCards, handData.turnCard]);
    progression.push({
      street: 'Turn',
      cards: [...heroCards, ...handData.flopCards, handData.turnCard],
      strength: turnStrength.strength,
      description: `${turnStrength.strength} after turn`
    });
  }

  // River strength
  if (handData.riverCard && handData.turnCard && handData.flopCards) {
    const riverStrength = calculateHandStrength([...heroCards, ...handData.flopCards, handData.turnCard, handData.riverCard]);
    progression.push({
      street: 'River',
      cards: [...heroCards, ...handData.flopCards, handData.turnCard, handData.riverCard],
      strength: riverStrength.strength,
      description: `Final hand: ${riverStrength.strength}`
    });
  }

  return progression;
};

/**
 * Estimate equity based on hand strength
 * @param {string} strength - Hand strength string
 * @returns {string} Equity percentage as string
 */
export const getEquityEstimate = (strength) => {
  const equityMap = {
    'High Card': '35',
    'One Pair': '55',
    'Two Pair': '75',
    'Three of a Kind': '85',
    'Straight': '90',
    'Flush': '92',
    'Full House': '96',
    'Four of a Kind': '99',
    'Straight Flush': '99.5',
    'Royal Flush': '100'
  };
  return equityMap[strength] || '50';
};

/**
 * Calculate hand statistics for overview
 * @param {Object} handData - Complete hand data
 * @param {string} amountWon - Amount won as string
 * @returns {Object} Hand statistics
 */
export const getHandStats = (handData, amountWon) => {
  const totalPot = handData.potSize || 0;
  const bigBlind = handData.bigBlind || 1;
  const bbWonLost = parseFloat(amountWon) / bigBlind || 0;
  
  return {
    totalPot,
    bbWonLost: bbWonLost.toFixed(1),
    netResult: parseFloat(amountWon) || 0
  };
};

/**
 * Auto-infer amount won/lost based on hand result
 * @param {string} handResult - 'won', 'lost', or 'chopped'
 * @param {number} potSize - Total pot size
 * @param {number} heroContribution - Amount hero put in pot
 * @returns {number} Inferred amount
 */
export const inferAmountFromResult = (handResult, potSize, heroContribution) => {
  let inferredAmount = 0;
  
  switch (handResult) {
    case 'won':
      // Won the entire pot minus what hero put in
      inferredAmount = potSize - heroContribution;
      break;
    case 'lost':
      // Lost what hero contributed
      inferredAmount = -heroContribution;
      break;
    case 'chopped':
      // Split pot evenly (assuming 2-way chop for simplicity)
      inferredAmount = (potSize / 2) - heroContribution;
      break;
    default:
      inferredAmount = 0;
  }
  
  return inferredAmount;
};

/**
 * Format action for human reading
 * @param {Object} action - Action object
 * @returns {string} Human readable action
 */
export const getReadableAction = (action) => {
  const { type, amount, raiseTo } = action;
  
  switch (type) {
    case 'fold': return 'folds';
    case 'check': return 'checks';
    case 'call': return `calls $${amount}`;
    case 'bet': return `bets $${amount}`;
    case 'raise': return `raises to $${raiseTo}`;
    case 'all_in': return `goes all-in for $${amount}`;
    case 'post_blind': return `posts blind $${amount}`;
    case 'post_straddle': return `posts straddle $${amount}`;
    default: return type;
  }
};

/**
 * Group actions by street
 * @param {Array} actions - All actions
 * @returns {Object} Actions grouped by street
 */
export const groupActionsByStreet = (actions) => {
  return {
    preflop: actions.filter(a => a.street === 'preflop'),
    flop: actions.filter(a => a.street === 'flop'),
    turn: actions.filter(a => a.street === 'turn'),
    river: actions.filter(a => a.street === 'river')
  };
};

/**
 * Get all actions from hand data
 * @param {Object} handData - Complete hand data
 * @returns {Array} All actions from all streets
 */
export const getAllActions = (handData) => {
  return [
    ...(handData.preflopActions || []),
    ...(handData.flopActions || []),
    ...(handData.turnActions || []),
    ...(handData.riverActions || [])
  ];
};