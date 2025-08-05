console.log('🔥 POKER ENGINE LOADED - NEW VERSION 🔥');

// Core poker logic engine with 100% accurate rules

export const POSITIONS = ['UTG', 'UTG+1', 'UTG+2', 'MP', 'MP+1', 'CO', 'BTN', 'SB', 'BB'];

export const ACTION_TYPES = {
  FOLD: 'fold',
  CHECK: 'check',
  CALL: 'call',
  BET: 'bet',
  RAISE: 'raise',
  ALL_IN: 'all_in',
  POST_BLIND: 'post_blind',
  POST_STRADDLE: 'post_straddle'
};

export class PokerEngine {
  constructor(gameConfig) {
    this.smallBlind = gameConfig.smallBlind;
    this.bigBlind = gameConfig.bigBlind;
    this.straddle = gameConfig.straddle; // { position: 'UTG', amount: 4 } or null
    this.effectiveStack = gameConfig.effectiveStack;
    
    // Table setup
    this.activePositions = gameConfig.activePositions || POSITIONS;
    this.customStacks = gameConfig.customStacks || null;
    
    // Game state
    this.actions = [];
    this.players = this.initializePlayers();
    this.currentBet = 0;
    this.lastRaiseAmount = 0;
    this.pot = 0;
    this.actionPosition = null;
    this.actionClosed = false;
    this.currentStreet = 'preflop';
    
    this.initializePreflop();
  }

  initializePlayers() {
    const players = {};
    this.activePositions.forEach(position => {
      const stackSize = this.customStacks?.[position] || this.effectiveStack;
      players[position] = {
        position,
        stack: stackSize,
        contributed: 0,
        folded: false,
        allIn: false,
        hasActed: false,
        lastAction: null
      };
    });
    return players;
  }

  initializePreflop() {
    // Post blinds automatically
    this.postBlind('SB', this.smallBlind);
    this.postBlind('BB', this.bigBlind);
    
    // Post straddle if exists
    if (this.straddle) {
      this.postStraddle(this.straddle.position, this.straddle.amount);
    }
    
    // Determine first action position
    this.actionPosition = this.getFirstActionPosition();
    this.currentBet = this.straddle ? this.straddle.amount : this.bigBlind;
    this.lastRaiseAmount = this.currentBet;
  }

  postBlind(position, amount) {
    // Only post blinds for active positions
    if (!this.activePositions.includes(position)) {
      return;
    }
    
    const player = this.players[position];
    if (!player) {
      return;
    }
    
    const actualAmount = Math.min(amount, player.stack);
    
    player.contributed = actualAmount;
    player.stack -= actualAmount;
    player.hasActed = false; // Blinds don't count as "acting" - they still need to act when action comes around
    player.lastAction = { type: ACTION_TYPES.POST_BLIND, amount: actualAmount };
    
    this.pot += actualAmount;
    this.actions.push({
      position,
      type: ACTION_TYPES.POST_BLIND,
      amount: actualAmount,
      street: 'preflop',
      timestamp: Date.now()
    });

    if (player.stack === 0) {
      player.allIn = true;
    }
  }

  postStraddle(position, amount) {
    // Only post straddle for active positions
    if (!this.activePositions.includes(position)) {
      return;
    }
    
    const player = this.players[position];
    if (!player) {
      return;
    }
    
    const actualAmount = Math.min(amount, player.stack);
    
    player.contributed = actualAmount;
    player.stack -= actualAmount;
    player.hasActed = false; // Straddle gets to act again when action comes around
    player.lastAction = { type: ACTION_TYPES.POST_STRADDLE, amount: actualAmount };
    
    this.pot += actualAmount;
    this.actions.push({
      position,
      type: ACTION_TYPES.POST_STRADDLE,
      amount: actualAmount,
      street: 'preflop',
      timestamp: Date.now()
    });

    if (player.stack === 0) {
      player.allIn = true;
    }
  }

  getFirstActionPosition() {
    if (this.straddle && this.activePositions.includes(this.straddle.position)) {
      // Action starts left of straddle
      const straddleIndex = this.activePositions.indexOf(this.straddle.position);
      return this.activePositions[(straddleIndex + 1) % this.activePositions.length];
    } else {
      // Standard action starts with first active position after BB
      // For 6-max: SB, BB, UTG, MP, CO, BTN - action starts UTG
      // For 9-max: standard UTG start
      const bbIndex = this.activePositions.indexOf('BB');
      if (bbIndex !== -1) {
        const nextIndex = (bbIndex + 1) % this.activePositions.length;
        return this.activePositions[nextIndex];
      }
      return this.activePositions[0];
    }
  }

  getNextActionPosition(currentPosition) {
    const currentIndex = this.activePositions.indexOf(currentPosition);
    let nextIndex = (currentIndex + 1) % this.activePositions.length;
    let attempts = 0;
    
    // Skip folded and all-in players
    while (attempts < this.activePositions.length) {
      const nextPosition = this.activePositions[nextIndex];
      const nextPlayer = this.players[nextPosition];
      
      if (!nextPlayer.folded && !nextPlayer.allIn) {
        return nextPosition;
      }
      
      nextIndex = (nextIndex + 1) % this.activePositions.length;
      attempts++;
    }
    
    // No valid next position found
    return null;
  }

  validateAction(position, actionType, amount = 0) {
    const player = this.players[position];
    const errors = [];

    // Check if position is active in current table setup
    if (!this.activePositions.includes(position)) {
      errors.push(`${position} is not active in current table setup`);
      return { valid: false, errors };
    }

    // Check if player exists
    if (!player) {
      errors.push(`Player ${position} does not exist`);
      return { valid: false, errors };
    }

    // Basic validations
    if (this.actionClosed) {
      errors.push('Action is closed for this street');
      return { valid: false, errors };
    }

    if (position !== this.actionPosition) {
      errors.push(`Not ${position}'s turn to act. Current action on ${this.actionPosition}`);
      return { valid: false, errors };
    }

    if (player.folded) {
      errors.push(`${position} has already folded`);
      return { valid: false, errors };
    }

    if (player.allIn) {
      errors.push(`${position} is already all-in`);
      return { valid: false, errors };
    }

    // Action-specific validations
    switch (actionType) {
      case ACTION_TYPES.FOLD:
        return this.validateFold(player);
      
      case ACTION_TYPES.CHECK:
        return this.validateCheck(player);
      
      case ACTION_TYPES.CALL:
        return this.validateCall(player, amount);
      
      case ACTION_TYPES.BET:
        return this.validateBet(player, amount);
      
      case ACTION_TYPES.RAISE:
        return this.validateRaise(player, amount);
      
      case ACTION_TYPES.ALL_IN:
        return this.validateAllIn(player);
      
      default:
        errors.push('Invalid action type');
        return { valid: false, errors };
    }
  }

  validateFold(player) {
    // Can always fold (unless already folded/all-in, checked above)
    return { valid: true, errors: [] };
  }

  validateCheck(player) {
    const callAmount = this.currentBet - player.contributed;
    
    if (callAmount > 0) {
      return { 
        valid: false, 
        errors: [`Cannot check. Must call $${callAmount} or fold`] 
      };
    }
    
    return { valid: true, errors: [] };
  }

  validateCall(player, amount) {
    const requiredCall = this.currentBet - player.contributed;
    
    if (requiredCall === 0) {
      return { 
        valid: false, 
        errors: ['Cannot call when there is no bet. Use check instead'] 
      };
    }

    const maxCall = Math.min(requiredCall, player.stack);
    
    if (amount !== maxCall) {
      return { 
        valid: false, 
        errors: [`Must call exactly $${maxCall}`] 
      };
    }
    
    return { valid: true, errors: [] };
  }

  validateBet(player, amount) {
    const errors = [];
    
    // Can only bet when there's no current bet
    if (this.currentBet > 0) {
      errors.push('Cannot bet when there is already a bet. Use raise instead');
      return { valid: false, errors };
    }
    
    if (amount > player.stack) {
      errors.push(`Insufficient stack. Has $${player.stack}, trying to bet $${amount}`);
    }

    if (amount <= 0) {
      errors.push('Bet amount must be greater than 0');
    }

    return { valid: errors.length === 0, errors };
  }

  validateRaise(player, raiseToAmount) {
    const errors = [];
    
    // Can only raise when there's already a bet
    if (this.currentBet === 0) {
      errors.push('Cannot raise when there is no bet. Use bet instead');
      return { valid: false, errors };
    }
    
    // raiseToAmount is the total amount player wants to bet (raise TO)
    const callAmount = this.currentBet - player.contributed;
    const totalRequired = raiseToAmount - player.contributed;
    
    if (totalRequired > player.stack) {
      errors.push(`Insufficient stack. Has $${player.stack}, needs $${totalRequired}`);
    }

    const minRaiseTo = this.currentBet + this.lastRaiseAmount;
    
    if (raiseToAmount < minRaiseTo && totalRequired < player.stack) {
      errors.push(`Minimum raise to $${minRaiseTo}. Current raise to $${raiseToAmount} is too small`);
    }

    if (raiseToAmount <= this.currentBet) {
      errors.push(`Raise must be higher than current bet of $${this.currentBet}`);
    }

    return { valid: errors.length === 0, errors };
  }

  validateAllIn(player) {
    if (player.stack === 0) {
      return { 
        valid: false, 
        errors: ['Player has no chips to go all-in with'] 
      };
    }
    
    return { valid: true, errors: [] };
  }

  executeAction(position, actionType, amount = 0) {
    const validation = this.validateAction(position, actionType, amount);
    
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    const player = this.players[position];
    
    switch (actionType) {
      case ACTION_TYPES.FOLD:
        return this.executeFold(player);
      
      case ACTION_TYPES.CHECK:
        return this.executeCheck(player);
      
      case ACTION_TYPES.CALL:
        return this.executeCall(player);
      
      case ACTION_TYPES.BET:
        return this.executeBet(player, amount);
      
      case ACTION_TYPES.RAISE:
        return this.executeRaise(player, amount);
      
      case ACTION_TYPES.ALL_IN:
        return this.executeAllIn(player);
    }
  }

  executeFold(player) {
    player.folded = true;
    player.hasActed = true;
    player.lastAction = { type: ACTION_TYPES.FOLD };
    
    this.actions.push({
      position: player.position,
      type: ACTION_TYPES.FOLD,
      street: this.currentStreet || 'preflop',
      timestamp: Date.now()
    });

    this.advanceAction();
    return { success: true };
  }

  executeCheck(player) {
    player.hasActed = true;
    player.lastAction = { type: ACTION_TYPES.CHECK };
    
    this.actions.push({
      position: player.position,
      type: ACTION_TYPES.CHECK,
      street: this.currentStreet || 'preflop',
      timestamp: Date.now()
    });

    this.advanceAction();
    return { success: true };
  }

  executeCall(player) {
    const callAmount = Math.min(
      this.currentBet - player.contributed,
      player.stack
    );
    
    player.contributed += callAmount;
    player.stack -= callAmount;
    player.hasActed = true;
    player.lastAction = { type: ACTION_TYPES.CALL, amount: callAmount };
    
    this.pot += callAmount;
    
    this.actions.push({
      position: player.position,
      type: ACTION_TYPES.CALL,
      amount: callAmount,
      street: this.currentStreet || 'preflop',
      timestamp: Date.now()
    });

    if (player.stack === 0) {
      player.allIn = true;
    }

    this.advanceAction();
    return { success: true };
  }

  executeBet(player, betAmount) {
    this.currentBet = betAmount;
    this.lastRaiseAmount = betAmount; // First bet sets the raise amount
    
    player.contributed = betAmount;
    player.stack -= betAmount;
    player.hasActed = true;
    player.lastAction = { 
      type: ACTION_TYPES.BET, 
      amount: betAmount 
    };
    
    this.pot += betAmount;
    
    this.actions.push({
      position: player.position,
      type: ACTION_TYPES.BET,
      amount: betAmount,
      street: this.currentStreet || 'preflop',
      timestamp: Date.now()
    });

    if (player.stack === 0) {
      player.allIn = true;
    }

    // Reset action for all other players
    this.reopenAction(player.position);
    this.advanceAction();
    return { success: true };
  }

  executeRaise(player, raiseToAmount) {
    // raiseToAmount is the TOTAL amount the player wants to bet (raise TO)
    const callAmount = this.currentBet - player.contributed;
    const totalRequired = raiseToAmount - player.contributed;
    
    if (totalRequired <= callAmount) {
      // This is actually just a call, not a raise
      return { success: false, errors: [`Amount too small. Must raise to at least $${this.currentBet + this.lastRaiseAmount}`] };
    }
    
    const oldCurrentBet = this.currentBet;
    this.currentBet = raiseToAmount;
    this.lastRaiseAmount = this.currentBet - oldCurrentBet;
    
    player.contributed = raiseToAmount;
    player.stack -= totalRequired;
    player.hasActed = true;
    player.lastAction = { 
      type: ACTION_TYPES.RAISE, 
      amount: totalRequired,
      raiseTo: this.currentBet 
    };
    
    this.pot += totalRequired;
    
    this.actions.push({
      position: player.position,
      type: ACTION_TYPES.RAISE,
      amount: totalRequired,
      raiseTo: this.currentBet,
      street: this.currentStreet || 'preflop',
      timestamp: Date.now()
    });

    if (player.stack === 0) {
      player.allIn = true;
    }

    // Reset action for all players except folder/all-in
    this.reopenAction(player.position);
    this.advanceAction();
    return { success: true };
  }

  executeAllIn(player) {
    const allInAmount = player.stack;
    const callAmount = this.currentBet - player.contributed;
    
    if (allInAmount > callAmount) {
      // All-in is a raise or bet
      if (this.currentBet === 0) {
        return this.executeBet(player, allInAmount);
      } else {
        const raiseAmount = allInAmount - callAmount;
        return this.executeRaise(player, player.contributed + allInAmount);
      }
    } else {
      // All-in is a call
      return this.executeCall(player);
    }
  }

  reopenAction(raiserPosition) {
    console.log(`Reopening action after ${raiserPosition} raised. Current bet: $${this.currentBet}`);
    
    // Reset hasActed for everyone except folded, all-in, and the raiser
    this.activePositions.forEach(position => {
      const player = this.players[position];
      if (!player.folded && !player.allIn && position !== raiserPosition) {
        const oldHasActed = player.hasActed;
        player.hasActed = false;
        console.log(`${position}: hasActed ${oldHasActed} -> ${player.hasActed}, contributed: $${player.contributed}`);
      }
    });
  }

  advanceAction() {
    console.log(`\nAdvancing action from ${this.actionPosition}`);
    const nextPosition = this.getNextActionPosition(this.actionPosition);
    console.log(`Next position: ${nextPosition}`);
    
    const isComplete = this.isActionComplete();
    console.log(`Is action complete: ${isComplete}`);
    
    if (nextPosition === null || isComplete) {
      console.log('Closing action');
      this.actionClosed = true;
      this.actionPosition = null;
    } else {
      console.log(`Setting action position to: ${nextPosition}`);
      this.actionPosition = nextPosition;
    }
    
    // Debug: show all active players and their status
    console.log('Active players status:');
    this.activePositions.forEach(pos => {
      const player = this.players[pos];
      if (!player.folded && !player.allIn) {
        console.log(`  ${pos}: hasActed=${player.hasActed}, contributed=$${player.contributed}, currentBet=$${this.currentBet}`);
      }
    });
  }

  isActionComplete() {
    // Get all players who are still active (not folded, not all-in)
    const activePlayers = this.activePositions.filter(pos => {
      const player = this.players[pos];
      return !player.folded && !player.allIn;
    });

    console.log(`\n🔥 CHECKING ACTION COMPLETE:`);
    console.log(`Active players: ${activePlayers.length} (${activePlayers.join(', ')})`);
    console.log(`Current bet: $${this.currentBet}`);

    // Special case: if only 1 active player remains, BUT they haven't matched the current bet,
    // they still need a chance to act (call, raise, or fold)
    if (activePlayers.length === 1) {
      const lastPlayer = this.players[activePlayers[0]];
      const needsToAct = !lastPlayer.hasActed || lastPlayer.contributed < this.currentBet;
      console.log(`Single player ${activePlayers[0]}: hasActed=${lastPlayer.hasActed}, contributed=$${lastPlayer.contributed}, needsToAct=${needsToAct}`);
      
      if (needsToAct) {
        console.log('✅ Action NOT complete: single player needs to respond to bet');
        return false;
      } else {
        console.log('❌ Action complete: single player has acted and matched bet');
        return true;
      }
    }

    // If 0 players, action is complete
    if (activePlayers.length === 0) {
      console.log('❌ Action complete: no active players');
      return true;
    }

    // Multiple active players: all must have acted and matched current bet
    const allComplete = activePlayers.every(position => {
      const player = this.players[position];
      const isComplete = player.hasActed && player.contributed === this.currentBet;
      console.log(`  ${position}: hasActed=${player.hasActed}, contributed=$${player.contributed}, complete=${isComplete}`);
      return isComplete;
    });

    console.log(`All players complete: ${allComplete}`);
    return allComplete;
  }

  getAvailableActions(position) {
    if (position !== this.actionPosition || this.actionClosed) {
      return [];
    }

    const player = this.players[position];
    const callAmount = this.currentBet - player.contributed;
    const actions = [];

    // Can always fold
    actions.push({ type: ACTION_TYPES.FOLD });

    // Check or call
    if (callAmount === 0) {
      actions.push({ type: ACTION_TYPES.CHECK });
    } else if (callAmount <= player.stack) {
      actions.push({ 
        type: ACTION_TYPES.CALL, 
        amount: callAmount 
      });
    }

    // Bet (if no current bet)
    if (this.currentBet === 0 && player.stack > 0) {
      actions.push({ 
        type: ACTION_TYPES.BET,
        minAmount: 1,
        maxAmount: player.stack
      });
    }

    // Raise (if there's already a bet)
    if (this.currentBet > 0 && player.stack > callAmount) {
      const minRaise = this.lastRaiseAmount;
      const maxRaise = player.stack - callAmount;
      
      if (maxRaise >= minRaise) {
        actions.push({ 
          type: ACTION_TYPES.RAISE,
          minAmount: minRaise,
          maxAmount: maxRaise
        });
      }
    }

    // All-in (if has chips)
    if (player.stack > 0) {
      actions.push({ 
        type: ACTION_TYPES.ALL_IN,
        amount: player.stack
      });
    }

    return actions;
  }

  getGameState() {
    return {
      players: { ...this.players },
      actions: [...this.actions],
      currentBet: this.currentBet,
      pot: this.pot,
      actionPosition: this.actionPosition,
      actionClosed: this.actionClosed,
      availableActions: this.actionPosition ? this.getAvailableActions(this.actionPosition) : []
    };
  }

  getHumanReadableAction(action) {
    const { position, type, amount, raiseTo } = action;
    
    switch (type) {
      case ACTION_TYPES.POST_BLIND:
        return `${position} posts blind $${amount}`;
      case ACTION_TYPES.POST_STRADDLE:
        return `${position} posts straddle $${amount}`;
      case ACTION_TYPES.FOLD:
        return `${position} folds`;
      case ACTION_TYPES.CHECK:
        return `${position} checks`;
      case ACTION_TYPES.CALL:
        return `${position} calls $${amount}`;
      case ACTION_TYPES.BET:
        return `${position} bets $${amount}`;
      case ACTION_TYPES.RAISE:
        return `${position} raises to $${raiseTo}`;
      case ACTION_TYPES.ALL_IN:
        return `${position} goes all-in for $${amount}`;
      default:
        return `${position} ${type}`;
    }
  }

  transitionToFlop() {
    // Reset for postflop action
    this.actionClosed = false;
    this.currentBet = 0;
    this.lastRaiseAmount = this.bigBlind; // Default bet size on flop
    
    // Reset hasActed for all active players
    Object.values(this.players).forEach(player => {
      if (!player.folded && !player.allIn) {
        player.hasActed = false;
        player.contributed = 0; // Reset street contributions
      }
    });

    // Determine first action position (SB if active, otherwise next active player)
    this.actionPosition = this.getFirstPostflopPosition();
    
    // Mark all actions as flop actions going forward
    this.currentStreet = 'flop';
  }

  getFirstPostflopPosition() {
    // Action starts with SB (or first active player after SB)
    const postflopOrder = ['SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'MP', 'MP+1', 'CO', 'BTN'];
    
    for (const position of postflopOrder) {
      const player = this.players[position];
      if (player && !player.folded && !player.allIn) {
        return position;
      }
    }
    
    return null; // No active players
  }
}