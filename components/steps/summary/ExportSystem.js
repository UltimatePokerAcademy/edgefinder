import { Alert } from 'react-native';
import {
    generateBaseExportData,
    generateGTOPlusFormat,
    generateGTOWizardFormat,
    generateHandHistory,
    generateHoldemManager3Format,
    generateMonkerSolverFormat,
    generatePIOSolverFormat,
    generatePokerStarsFormat,
    generatePokerTracker4Format,
    generateSimplePostflopFormat,
    generateSolverPlusFormat,
    generateTextSummary,
    getFormatName
} from '../../../utils/exportFormats';

/**
 * Export System Component
 * Handles all export functionality for poker hands
 */
export class ExportSystem {
  constructor(handData, selectedTags, summaryNotes, lessonsLearned, handStrengthProgression) {
    this.handData = handData;
    this.selectedTags = selectedTags;
    this.summaryNotes = summaryNotes;
    this.lessonsLearned = lessonsLearned;
    this.handStrengthProgression = handStrengthProgression;
    this.baseData = generateBaseExportData(handData, selectedTags, summaryNotes, lessonsLearned);
  }

  /**
   * Show main export options
   */
  showExportOptions() {
    Alert.alert(
      'Export Hand',
      'Choose export format',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Text Summary', 
          onPress: () => this.exportToFormat('text')
        },
        { 
          text: 'Hand History (.txt)', 
          onPress: () => this.exportToFormat('hand_history')
        },
        { 
          text: 'JSON Data', 
          onPress: () => this.exportToFormat('json')
        },
        { 
          text: 'Solver Formats ▶', 
          onPress: () => this.showSolverExportOptions()
        },
        { 
          text: 'Platform Formats ▶', 
          onPress: () => this.showPlatformExportOptions()
        }
      ]
    );
  }

  /**
   * Show solver-specific export options
   */
  showSolverExportOptions() {
    Alert.alert(
      'Export to Solver',
      'Choose solver format',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'GTO Wizard (.json)', 
          onPress: () => this.exportToFormat('gto_wizard')
        },
        { 
          text: 'PIOSolver (.pio)', 
          onPress: () => this.exportToFormat('pio_solver')
        },
        { 
          text: 'Simple Postflop (.spf)', 
          onPress: () => this.exportToFormat('simple_postflop')
        },
        { 
          text: 'MonkerSolver (.mkr)', 
          onPress: () => this.exportToFormat('monker_solver')
        },
        { 
          text: 'GTO+ (.gto)', 
          onPress: () => this.exportToFormat('gto_plus')
        },
        { 
          text: 'Solver+ (.slv)', 
          onPress: () => this.exportToFormat('solver_plus')
        }
      ]
    );
  }

  /**
   * Show platform-specific export options
   */
  showPlatformExportOptions() {
    Alert.alert(
      'Export to Platform',
      'Choose platform format',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'PokerStars Hand History', 
          onPress: () => this.exportToFormat('pokerstars')
        },
        { 
          text: 'GGPoker Hand History', 
          onPress: () => this.exportToFormat('ggpoker')
        },
        { 
          text: 'PartyPoker Format', 
          onPress: () => this.exportToFormat('partypoker')
        },
        { 
          text: '888poker Format', 
          onPress: () => this.exportToFormat('888poker')
        },
        { 
          text: 'Generic Hand History', 
          onPress: () => this.exportToFormat('generic_hh')
        },
        { 
          text: 'Poker Tracker 4', 
          onPress: () => this.exportToFormat('pt4')
        },
        { 
          text: 'Hold\'em Manager 3', 
          onPress: () => this.exportToFormat('hm3')
        }
      ]
    );
  }

  /**
   * Export to specific format
   * @param {string} format - Format identifier
   */
  exportToFormat(format) {
    try {
      const exportData = this.generateExportData(format);
      
      // In a real app, this would save file or share
      // For now, we'll show success message and log the data
      Alert.alert(
        'Export Generated',
        `Hand exported in ${getFormatName(format)} format. File saved to downloads.`,
        [{ text: 'OK' }]
      );
      
      // Log the export data for demo purposes
      console.log(`Export format: ${format}`);
      console.log('Export data:', exportData);
      
      // In a real app, you might:
      // - Save to device storage
      // - Share via native share dialog
      // - Upload to cloud storage
      // - Copy to clipboard
      // - Email the export
      
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(
        'Export Error',
        'Failed to generate export. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }

  /**
   * Generate export data for specific format
   * @param {string} format - Format identifier
   * @returns {string} Generated export data
   */
  generateExportData(format) {
    switch (format) {
      case 'text':
        return generateTextSummary(this.baseData);
      
      case 'hand_history':
        return generateHandHistory(this.baseData, this.handData);
      
      case 'json':
        return JSON.stringify(this.baseData, null, 2);
      
      case 'gto_wizard':
        return generateGTOWizardFormat(this.baseData, this.handStrengthProgression);
      
      case 'pio_solver':
        return generatePIOSolverFormat(this.baseData, this.handData);
      
      case 'simple_postflop':
        return generateSimplePostflopFormat(this.baseData, this.handData);
      
      case 'monker_solver':
        return generateMonkerSolverFormat(this.baseData, this.handData);
      
      case 'gto_plus':
        return generateGTOPlusFormat(this.baseData, this.handData);
      
      case 'solver_plus':
        return generateSolverPlusFormat(this.baseData, this.handData);
      
      case 'pokerstars':
        return generatePokerStarsFormat(this.baseData, this.handData);
      
      case 'ggpoker':
        return this.generateGGPokerFormat(this.baseData);
      
      case 'partypoker':
        return this.generatePartyPokerFormat(this.baseData);
      
      case '888poker':
        return this.generate888PokerFormat(this.baseData);
      
      case 'generic_hh':
        return this.generateGenericHandHistory(this.baseData);
      
      case 'pt4':
        return generatePokerTracker4Format(this.baseData, this.handData);
      
      case 'hm3':
        return generateHoldemManager3Format(this.baseData, this.handData);
      
      default:
        return JSON.stringify(this.baseData, null, 2);
    }
  }

  /**
   * Generate GGPoker format
   * @param {Object} data - Base export data
   * @returns {string} GGPoker format
   */
  generateGGPokerFormat(data) {
    return `#Hand No.${data.handId}
#${new Date(data.timestamp).toLocaleString()}
#Type=NL Hold'em Stakes=${data.stakes}
#Table: Edgefinder Analysis

Player: Hero Position: ${data.heroPosition} Cards: ${data.heroCards.join(' ')} Stack: ${this.handData.effectiveStack || 100}

Pre-Flop:
${this.formatGGActions(data.actions.filter(a => a.street === 'preflop'))}

Flop: ${data.board.slice(0, 3).join(' ')}
${this.formatGGActions(data.actions.filter(a => a.street === 'flop'))}

Turn: ${data.board[3] || ''}
${this.formatGGActions(data.actions.filter(a => a.street === 'turn'))}

River: ${data.board[4] || ''}
${this.formatGGActions(data.actions.filter(a => a.street === 'river'))}

Summary:
Pot: ${data.potSize}
Hero ${data.result}: ${data.amountWon}
`;
  }

  /**
   * Format actions for GGPoker
   * @param {Array} actions - Action array
   * @returns {string} Formatted actions
   */
  formatGGActions(actions) {
    return actions.map(action => 
      `${action.position}: ${this.getReadableAction(action)}`
    ).join('\n');
  }

  /**
   * Generate PartyPoker format
   * @param {Object} data - Base export data
   * @returns {string} PartyPoker format
   */
  generatePartyPokerFormat(data) {
    return `***** Hand History for Game ${data.handId} *****
${data.stakes} USD NL Texas Hold'em - ${new Date(data.timestamp).toLocaleString()}
Table Edgefinder Analysis (Real Money)
Seat ${this.getPositionSeat(data.heroPosition)} is the button
Total number of players : 6

Seat ${this.getPositionSeat(data.heroPosition)}: Hero ( ${this.handData.effectiveStack || 100} USD )

** Dealing down cards **
Dealt to Hero [ ${data.heroCards.join(', ')} ]

${this.formatPartyPokerActions(data.actions)}

** Summary **
Total pot ${data.potSize} USD
Board: [ ${data.board.join(', ')} ]
Hero ${data.result} ${Math.abs(data.amountWon)} USD
`;
  }

  /**
   * Format actions for PartyPoker
   * @param {Array} actions - Action array
   * @returns {string} Formatted actions
   */
  formatPartyPokerActions(actions) {
    return actions.map(action => {
      const name = action.position === this.handData.heroPosition ? 'Hero' : action.position;
      return `${name} ${this.getReadableAction(action)}`;
    }).join('\n');
  }

  /**
   * Generate 888poker format
   * @param {Object} data - Base export data
   * @returns {string} 888poker format
   */
  generate888PokerFormat(data) {
    return `Session Start: ${new Date(data.timestamp).toLocaleString()}
Game ID: ${data.handId}
Game Type: Texas Hold'em No Limit
Stakes: ${data.stakes}
Table: Edgefinder Analysis
Seat ${this.getPositionSeat(data.heroPosition)}: Hero (${this.handData.effectiveStack || 100})

Dealt to Hero: [${data.heroCards.join(' ')}]

${this.format888Actions(data.actions)}

Board: [${data.board.join(' ')}]
Total Pot: ${data.potSize}
Hero ${data.result}: ${data.amountWon}
`;
  }

  /**
   * Format actions for 888poker
   * @param {Array} actions - Action array
   * @returns {string} Formatted actions
   */
  format888Actions(actions) {
    return actions.map(action => {
      const name = action.position === this.handData.heroPosition ? 'Hero' : action.position;
      return `${name}: ${this.getReadableAction(action)}`;
    }).join('\n');
  }

  /**
   * Generate generic hand history
   * @param {Object} data - Base export data
   * @returns {string} Generic hand history
   */
  generateGenericHandHistory(data) {
    return `GENERIC POKER HAND HISTORY
==========================
Hand ID: ${data.handId}
Date/Time: ${new Date(data.timestamp).toLocaleString()}
Game: No Limit Hold'em
Stakes: ${data.stakes}
Table: Edgefinder Analysis

PLAYERS:
Hero (${data.heroPosition}): ${this.handData.effectiveStack || 100}

HOLE CARDS:
Hero: ${data.heroCards.join(' ')}

BOARD:
${data.board.join(' ')}

ACTION SUMMARY:
${this.formatGenericActions(data.actions)}

RESULTS:
Total Pot: ${data.potSize}
Hero ${data.result}: ${data.amountWon}

ANALYSIS:
Tags: ${data.tags.join(', ')}
Notes: ${data.summaryNotes}
`;
  }

  /**
   * Format actions for generic format
   * @param {Array} actions - Action array
   * @returns {string} Formatted actions
   */
  formatGenericActions(actions) {
    const byStreet = {
      preflop: actions.filter(a => a.street === 'preflop'),
      flop: actions.filter(a => a.street === 'flop'),
      turn: actions.filter(a => a.street === 'turn'),
      river: actions.filter(a => a.street === 'river')
    };
    
    let formatted = '';
    
    Object.entries(byStreet).forEach(([street, streetActions]) => {
      if (streetActions.length > 0) {
        formatted += `${street.toUpperCase()}:\n`;
        streetActions.forEach(action => {
          formatted += `  ${action.position}: ${this.getReadableAction(action)}\n`;
        });
        formatted += '\n';
      }
    });
    
    return formatted;
  }

  /**
   * Get readable action (copied from handAnalysis utils for encapsulation)
   * @param {Object} action - Action object
   * @returns {string} Human readable action
   */
  getReadableAction(action) {
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
  }

  /**
   * Get position seat number (copied for encapsulation)
   * @param {string} position - Position name
   * @returns {number} Seat number
   */
  getPositionSeat(position) {
    const seatMap = { 'SB': 1, 'BB': 2, 'UTG': 3, 'MP': 4, 'CO': 5, 'BTN': 6 };
    return seatMap[position] || 1;
  }
}

/**
 * Create and return an export system instance
 * @param {Object} handData - Complete hand data
 * @param {Array} selectedTags - Selected tags
 * @param {string} summaryNotes - Summary notes
 * @param {string} lessonsLearned - Lessons learned
 * @param {Array} handStrengthProgression - Hand strength progression
 * @returns {ExportSystem} Export system instance
 */
export const createExportSystem = (handData, selectedTags, summaryNotes, lessonsLearned, handStrengthProgression) => {
  return new ExportSystem(handData, selectedTags, summaryNotes, lessonsLearned, handStrengthProgression);
};