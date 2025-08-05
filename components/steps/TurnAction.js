import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { cardStyles, colors, inputStyles, spacing, typography } from '../../styles/theme';
import { ACTION_TYPES, PokerEngine } from '../../utils/pokerEngine';

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

const SUIT_COLORS = {
  '♠': '#000000',
  '♣': '#000000', 
  '♥': '#dc3545',
  '♦': '#dc3545',
};

export default function TurnAction({ handData, updateHandData }) {
  const [engine, setEngine] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [raiseAmount, setRaiseAmount] = useState('');
  const [showRaiseInput, setShowRaiseInput] = useState(false);
  const [showCardSelector, setShowCardSelector] = useState(true);

  // Get hero context from handData
  const heroCards = handData.heroCards || [];
  const heroPosition = handData.heroPosition || '';

  // Calculate hand strength
  const getHandStrength = () => {
    if (!selectedCard || !handData.flopCards || handData.flopCards.length < 3 || !heroCards || heroCards.length < 2) {
      return null;
    }

    const allCards = [...heroCards, ...handData.flopCards, selectedCard];
    
    // Basic hand evaluation - simplified for now
    const ranks = allCards.map(card => card[0]);
    const suits = allCards.map(card => card[1]);
    
    // Count rank frequencies
    const rankCounts = {};
    ranks.forEach(rank => {
      rankCounts[rank] = (rankCounts[rank] || 0) + 1;
    });
    
    const counts = Object.values(rankCounts).sort((a, b) => b - a);
    const uniqueRanks = Object.keys(rankCounts);
    
    // Check for flush
    const suitCounts = {};
    suits.forEach(suit => {
      suitCounts[suit] = (suitCounts[suit] || 0) + 1;
    });
    const maxSuitCount = Math.max(...Object.values(suitCounts));
    const isFlush = maxSuitCount >= 5;
    
    // Basic hand strength evaluation
    if (counts[0] === 4) return { strength: 'Four of a Kind', rank: 9 };
    if (counts[0] === 3 && counts[1] === 2) return { strength: 'Full House', rank: 8 };
    if (isFlush) return { strength: 'Flush', rank: 7 };
    if (counts[0] === 3) return { strength: 'Three of a Kind', rank: 5 };
    if (counts[0] === 2 && counts[1] === 2) return { strength: 'Two Pair', rank: 4 };
    if (counts[0] === 2) return { strength: 'One Pair', rank: 3 };
    
    return { strength: 'High Card', rank: 1 };
  };

  const handStrength = getHandStrength();

  // Initialize turn engine from flop data
  useEffect(() => {
    if (handData.flopActions && handData.flopCards && handData.flopCards.length === 3) {
      initializeTurnFromFlop();
    }
  }, [handData.flopActions, handData.flopCards]);

  const initializeTurnFromFlop = () => {
    try {
      console.log('🔥 Initializing Turn from Flop Data');
      console.log('Active positions:', handData.activePositions);
      console.log('Flop actions count:', handData.flopActions?.length);

      // Create engine with EXACT same config as previous streets
      const config = {
        smallBlind: handData.smallBlind,
        bigBlind: handData.bigBlind,
        straddle: handData.straddle,
        effectiveStack: handData.effectiveStack || 100,
        activePositions: handData.activePositions || ['SB', 'BB', 'UTG', 'MP', 'CO', 'BTN'],
        customStacks: handData.customStacks || null
      };

      console.log('Turn engine config:', config);

      const newEngine = new PokerEngine(config);
      
      // Replay all preflop actions
      const preflopActions = handData.preflopActions.filter(action => 
        action.type !== ACTION_TYPES.POST_BLIND && 
        action.type !== ACTION_TYPES.POST_STRADDLE
      );

      console.log('Replaying preflop actions:', preflopActions.length);
      preflopActions.forEach(action => {
        newEngine.executeAction(action.position, action.type, action.amount || 0);
      });

      // Transition to flop and replay flop actions
      newEngine.transitionToFlop();
      
      if (handData.flopActions && handData.flopActions.length > 0) {
        console.log('Replaying flop actions:', handData.flopActions.length);
        handData.flopActions.forEach(action => {
          newEngine.executeAction(action.position, action.type, action.amount || 0);
        });
      }

      // Transition to turn (reuse flop transition logic but change street)
      console.log('Transitioning to turn...');
      newEngine.actionClosed = false;
      newEngine.currentBet = 0;
      newEngine.lastRaiseAmount = newEngine.bigBlind;
      newEngine.currentStreet = 'turn'; // This is the key change from flop
      
      // Reset hasActed for all active players
      Object.values(newEngine.players).forEach(player => {
        if (!player.folded && !player.allIn) {
          player.hasActed = false;
          player.contributed = 0; // Reset street contributions
        }
      });

      // Set first action position for turn
      newEngine.actionPosition = newEngine.getFirstPostflopPosition();
      
      const turnState = newEngine.getGameState();
      console.log('Turn initialized - Action position:', turnState.actionPosition);
      console.log('Turn pot:', turnState.pot);
      
      setEngine(newEngine);
      // FIXED: Force new reference for initial state
      setGameState({
        ...turnState,
        _timestamp: Date.now()
      });
      
      // Set turn card if already selected
      if (handData.turnCard) {
        setSelectedCard(handData.turnCard);
        setShowCardSelector(false);
      }
      
    } catch (error) {
      console.error('Error initializing turn:', error);
    }
  };

  const selectCard = (rank, suit) => {
    const card = `${rank}${suit}`;
    
    // Check if card is already used on the board
    const usedCards = [...(handData.flopCards || [])];
    if (usedCards.includes(card)) {
      Alert.alert('Card Already Used', 'This card is already on the board');
      return;
    }
    
    setSelectedCard(card);
    setShowCardSelector(false);
    updateHandData({ turnCard: card });
  };

  const clearSelectedCard = () => {
    setSelectedCard(null);
    setShowCardSelector(true);
    updateHandData({ turnCard: null });
  };

  const changeSelectedCard = () => {
    setShowCardSelector(true);
    // Keep the current card selected but allow changing it
  };

  const executeAction = (actionType, amount = 0) => {
    if (!engine || !gameState.actionPosition) {
      console.log('Cannot execute action - no engine or action position');
      return;
    }

    console.log(`Executing ${actionType} for ${gameState.actionPosition} with amount ${amount}`);
    
    const result = engine.executeAction(gameState.actionPosition, actionType, amount);
    
    console.log('Action result:', result);
    
    if (result.success) {
      const newGameState = engine.getGameState();
      console.log('New game state:', newGameState);
      
      // FIXED: Force new reference to trigger re-render
      setGameState(prevState => ({
        ...newGameState,
        _timestamp: Date.now()
      }));
      
      setShowRaiseInput(false);
      setRaiseAmount('');
      
      // Update parent component with turn actions
      updateHandData({
        turnActions: [...newGameState.actions.filter(a => a.street === 'turn')],
        potSize: newGameState.pot
      });
    } else {
      console.log('Action failed:', result.errors);
      Alert.alert('Invalid Action', result.errors.join('\n'));
    }
  };

  const handleRaise = () => {
    const amount = parseFloat(raiseAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid raise amount');
      return;
    }
    executeAction(ACTION_TYPES.RAISE, amount);
  };

  const handleBet = () => {
    const amount = parseFloat(raiseAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid bet amount');
      return;
    }
    executeAction(ACTION_TYPES.BET, amount);
  };

  const undoLastAction = () => {
    console.log('undoLastAction called');
    
    if (!engine || !gameState.actions || gameState.actions.length === 0) {
      console.log('No actions to undo');
      return;
    }

    // Find the last turn action
    const turnActions = gameState.actions.filter(action => 
      action.street === 'turn'
    );

    if (turnActions.length === 0) {
      console.log('No turn actions to undo');
      return;
    }

    console.log('Undoing last turn action:', turnActions[turnActions.length - 1]);
    
    // Rebuild game state without the last turn action
    rebuildGameStateWithoutLastTurnAction();
  };

  const rebuildGameStateWithoutLastTurnAction = () => {
    console.log('Rebuilding turn game state...');
    
    try {
      // Get all actions except the last turn action
      const allActions = [...gameState.actions];
      const turnActions = allActions.filter(action => action.street === 'turn');
      
      console.log('Turn actions:', turnActions.length);
      
      // Remove the last turn action
      const turnActionsToReplay = turnActions.slice(0, -1);
      console.log('Turn actions to replay:', turnActionsToReplay.length);
      
      // Recreate engine with SAME config as original
      const config = {
        smallBlind: handData.smallBlind,
        bigBlind: handData.bigBlind,
        straddle: handData.straddle,
        effectiveStack: handData.effectiveStack || 100,
        activePositions: handData.activePositions || ['SB', 'BB', 'UTG', 'MP', 'CO', 'BTN'],
        customStacks: handData.customStacks || null
      };
      
      const newEngine = new PokerEngine(config);
      
      // Replay preflop actions (non-blind/straddle)
      const preflopActions = handData.preflopActions.filter(action => 
        action.type !== ACTION_TYPES.POST_BLIND && 
        action.type !== ACTION_TYPES.POST_STRADDLE
      );

      preflopActions.forEach(action => {
        newEngine.executeAction(action.position, action.type, action.amount || 0);
      });

      // Transition to flop and replay flop actions
      newEngine.transitionToFlop();
      
      if (handData.flopActions && handData.flopActions.length > 0) {
        handData.flopActions.forEach(action => {
          newEngine.executeAction(action.position, action.type, action.amount || 0);
        });
      }

      // Transition to turn
      newEngine.actionClosed = false;
      newEngine.currentBet = 0;
      newEngine.lastRaiseAmount = newEngine.bigBlind;
      newEngine.currentStreet = 'turn';
      
      Object.values(newEngine.players).forEach(player => {
        if (!player.folded && !player.allIn) {
          player.hasActed = false;
          player.contributed = 0;
        }
      });
      newEngine.actionPosition = newEngine.getFirstPostflopPosition();
      
      // Replay turn actions except the last one
      turnActionsToReplay.forEach((action, index) => {
        console.log(`Replaying turn action ${index + 1}:`, action);
        newEngine.executeAction(action.position, action.type, action.amount || 0);
      });
      
      setEngine(newEngine);
      const newGameState = newEngine.getGameState();
      
      // FIXED: Use functional update with timestamp to ensure re-render
      setGameState(prevState => ({
        ...newGameState,
        _timestamp: Date.now()
      }));
      
      updateHandData({
        turnActions: [...newGameState.actions.filter(a => a.street === 'turn')],
        potSize: newGameState.pot
      });
      
      console.log('Turn undo completed successfully');
    } catch (error) {
      console.error('Error during turn undo:', error);
    }
  };

  const clearAllTurnActions = () => {
    console.log('clearAllTurnActions called');
    
    const turnActions = gameState?.actions?.filter(a => a.street === 'turn') || [];
    if (turnActions.length === 0) {
      console.log('No turn actions to clear');
      return;
    }

    console.log('Clearing all turn actions...');
    
    try {
      // Recreate engine with flop state only
      const config = {
        smallBlind: handData.smallBlind,
        bigBlind: handData.bigBlind,
        straddle: handData.straddle,
        effectiveStack: handData.effectiveStack || 100,
        activePositions: handData.activePositions || ['SB', 'BB', 'UTG', 'MP', 'CO', 'BTN'],
        customStacks: handData.customStacks || null
      };
      
      const newEngine = new PokerEngine(config);
      
      // Replay preflop actions
      const preflopActions = handData.preflopActions.filter(action => 
        action.type !== ACTION_TYPES.POST_BLIND && 
        action.type !== ACTION_TYPES.POST_STRADDLE
      );

      preflopActions.forEach(action => {
        newEngine.executeAction(action.position, action.type, action.amount || 0);
      });

      // Transition to flop and replay flop actions
      newEngine.transitionToFlop();
      
      if (handData.flopActions && handData.flopActions.length > 0) {
        handData.flopActions.forEach(action => {
          newEngine.executeAction(action.position, action.type, action.amount || 0);
        });
      }

      // Transition to turn (manual)
      newEngine.actionClosed = false;
      newEngine.currentBet = 0;
      newEngine.lastRaiseAmount = newEngine.bigBlind;
      newEngine.currentStreet = 'turn';
      
      Object.values(newEngine.players).forEach(player => {
        if (!player.folded && !player.allIn) {
          player.hasActed = false;
          player.contributed = 0;
        }
      });
      newEngine.actionPosition = newEngine.getFirstPostflopPosition();
      
      setEngine(newEngine);
      const newGameState = newEngine.getGameState();
      
      // FIXED: Force new reference for clear action
      setGameState({
        ...newGameState,
        _timestamp: Date.now()
      });
      
      updateHandData({ 
        turnActions: [],
        potSize: newGameState.pot 
      });
      
      console.log('Clear turn actions completed successfully');
    } catch (error) {
      console.error('Error during clear turn actions:', error);
    }
  };

  const forceEndStreet = () => {
    console.log('forceEndStreet called');
    
    if (!engine || gameState.actionClosed) {
      console.log('Action already closed');
      return;
    }

    console.log('Forcing end of turn...');
    
    try {
      // Force close the action
      engine.actionClosed = true;
      engine.actionPosition = null;
      const newGameState = engine.getGameState();
      
      // FIXED: Force new reference for force end action
      setGameState({
        ...newGameState,
        _timestamp: Date.now()
      });
      
      updateHandData({
        turnActions: [...newGameState.actions.filter(a => a.street === 'turn')],
        potSize: newGameState.pot
      });
      
      console.log('Force end turn completed successfully');
    } catch (error) {
      console.error('Error during force end turn:', error);
    }
  };

  const renderCardSelector = () => {
    return (
      <View style={cardStyles.container}>
        <View style={styles.cardSelectorHeader}>
          <Text style={cardStyles.header}>Select Turn Card (1)</Text>
          <View style={styles.cardHeaderButtons}>
            {selectedCard && (
              <TouchableOpacity onPress={changeSelectedCard} style={styles.changeCardButton}>
                <Text style={styles.changeCardText}>Change</Text>
              </TouchableOpacity>
            )}
            {selectedCard && (
              <TouchableOpacity onPress={clearSelectedCard} style={styles.clearCardButton}>
                <Text style={styles.clearCardText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Selected Card Display */}
        {selectedCard && !showCardSelector && (
          <View style={styles.selectedCardContainer}>
            <Text style={styles.selectedCardLabel}>Turn Card:</Text>
            <View style={styles.selectedCardDisplay}>
              <Text style={[styles.cardText, { color: SUIT_COLORS[selectedCard[1]] }]}>
                {selectedCard[0]}{selectedCard[1]}
              </Text>
            </View>
            <Text style={styles.cardSelectedHint}>Tap "Change" to select a different card</Text>
          </View>
        )}

        {/* Card Grid - Show when selector is open OR no card selected */}
        {(showCardSelector || !selectedCard) && (
          <>
            {selectedCard && (
              <Text style={styles.changeCardHint}>Select a new turn card:</Text>
            )}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardGrid}>
              {RANKS.map(rank => (
                <View key={rank} style={styles.rankColumn}>
                  <Text style={styles.rankHeader}>{rank}</Text>
                  {SUITS.map(suit => {
                    const card = `${rank}${suit}`;
                    const isSelected = selectedCard === card;
                    const isUsed = [...(handData.flopCards || [])].includes(card);
                    
                    return (
                      <TouchableOpacity
                        key={suit}
                        style={[
                          styles.cardButton,
                          isSelected && styles.cardButtonSelected,
                          isUsed && styles.cardButtonUsed
                        ]}
                        onPress={() => selectCard(rank, suit)}
                        disabled={isUsed}
                      >
                        <Text style={[
                          styles.cardButtonText,
                          { color: SUIT_COLORS[suit] },
                          isSelected && styles.cardButtonTextSelected,
                          isUsed && styles.cardButtonTextUsed
                        ]}>
                          {rank}{suit}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </>
        )}
      </View>
    );
  };

  const renderHeroInfo = () => {
    if (!heroCards || heroCards.length < 2) return null;

    return (
      <View style={cardStyles.container}>
        <Text style={cardStyles.header}>Your Hand</Text>
        
        <View style={styles.heroInfoContainer}>
          {/* Hero Cards */}
          <View style={styles.heroCardsSection}>
            <Text style={styles.heroLabel}>Your Cards:</Text>
            <View style={styles.heroCards}>
              {heroCards.map((card, index) => (
                <View key={index} style={styles.heroCard}>
                  <Text style={[styles.heroCardText, { color: SUIT_COLORS[card[1]] }]}>
                    {card[0]}
                  </Text>
                  <Text style={[styles.heroCardSuit, { color: SUIT_COLORS[card[1]] }]}>
                    {card[1]}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Hero Position */}
          {heroPosition && (
            <View style={styles.heroPositionSection}>
              <Text style={styles.heroLabel}>Position:</Text>
              <View style={styles.heroPositionChip}>
                <Text style={styles.heroPositionText}>{heroPosition}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Hand Strength */}
        {handStrength && (
          <View style={styles.handStrengthContainer}>
            <Text style={styles.handStrengthLabel}>Hand Strength:</Text>
            <View style={[styles.handStrengthChip, { backgroundColor: getStrengthColor(handStrength.rank) }]}>
              <Text style={styles.handStrengthText}>{handStrength.strength}</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const getStrengthColor = (rank) => {
    if (rank >= 8) return colors.success; // Full house+
    if (rank >= 5) return colors.warning; // Three of a kind+
    if (rank >= 3) return colors.info; // Pair+
    return colors.textMuted; // High card
  };

  const renderBoard = () => {
    if (!handData.flopCards || handData.flopCards.length < 3) return null;

    const allCards = [...handData.flopCards];
    if (selectedCard) {
      allCards.push(selectedCard);
    }

    return (
      <View style={cardStyles.container}>
        <Text style={cardStyles.header}>Board</Text>
        <View style={styles.boardContainer}>
          {allCards.map((card, index) => (
            <View key={index} style={[
              styles.boardCard,
              index === 3 && styles.turnCard // Highlight turn card
            ]}>
              <Text style={[styles.boardCardText, { color: SUIT_COLORS[card[1]] }]}>
                {card[0]}
              </Text>
              <Text style={[styles.boardCardSuit, { color: SUIT_COLORS[card[1]] }]}>
                {card[1]}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderPotAndAction = () => (
    <View style={styles.potActionContainer}>
      <View style={styles.potDisplay}>
        <Text style={styles.potLabel}>Pot Size</Text>
        <Text style={styles.potAmount}>${gameState?.pot || handData.potSize || 0}</Text>
      </View>
      
      {gameState?.actionPosition && (
        <View style={styles.actionIndicator}>
          <Text style={styles.actionLabel}>Action on</Text>
          <Text style={[
            styles.actionPosition,
            gameState.actionPosition === heroPosition && styles.heroActionPosition
          ]}>
            {gameState.actionPosition}
            {gameState.actionPosition === heroPosition && ' (YOU)'}
          </Text>
        </View>
      )}
      
      {gameState?.actionClosed && (
        <View style={styles.closedIndicator}>
          <Text style={styles.closedText}>Action Closed</Text>
        </View>
      )}
    </View>
  );

  const renderActionButtons = () => {
    if (!gameState?.actionPosition || gameState.actionClosed || !selectedCard) {
      return null;
    }

    const availableActions = gameState.availableActions || [];

    return (
      <View style={cardStyles.container}>
        <Text style={cardStyles.header}>Available Actions</Text>
        
        <View style={styles.actionButtonsContainer}>
          {/* First Row: Fold and Check/Call */}
          <View style={styles.actionButtonRow}>
            {availableActions.find(a => a.type === ACTION_TYPES.FOLD) && (
              <TouchableOpacity
                style={[styles.actionButton, styles.foldButton]}
                onPress={() => executeAction(ACTION_TYPES.FOLD)}
              >
                <Text style={styles.actionButtonText}>Fold</Text>
              </TouchableOpacity>
            )}
            
            {availableActions.find(a => a.type === ACTION_TYPES.CHECK) && (
              <TouchableOpacity
                style={[styles.actionButton, styles.checkButton]}
                onPress={() => executeAction(ACTION_TYPES.CHECK)}
              >
                <Text style={styles.actionButtonText}>Check</Text>
              </TouchableOpacity>
            )}
            
            {availableActions.find(a => a.type === ACTION_TYPES.CALL) && (
              <TouchableOpacity
                style={[styles.actionButton, styles.callButton]}
                onPress={() => executeAction(ACTION_TYPES.CALL, availableActions.find(a => a.type === ACTION_TYPES.CALL).amount)}
              >
                <Text style={styles.actionButtonText}>Call ${availableActions.find(a => a.type === ACTION_TYPES.CALL).amount}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Second Row: Bet/Raise and All-In */}
          <View style={styles.actionButtonRow}>
            {availableActions.find(a => a.type === ACTION_TYPES.BET) && (
              <TouchableOpacity
                style={[styles.actionButton, styles.betButton]}
                onPress={() => setShowRaiseInput(!showRaiseInput)}
              >
                <Text style={styles.actionButtonText}>
                  Bet $1 - ${availableActions.find(a => a.type === ACTION_TYPES.BET).maxAmount}
                </Text>
              </TouchableOpacity>
            )}
            
            {availableActions.find(a => a.type === ACTION_TYPES.RAISE) && (
              <TouchableOpacity
                style={[styles.actionButton, styles.raiseButton]}
                onPress={() => setShowRaiseInput(!showRaiseInput)}
              >
                <Text style={styles.actionButtonText}>
                  Raise TO ${gameState.currentBet + availableActions.find(a => a.type === ACTION_TYPES.RAISE).minAmount} - ${gameState.currentBet + availableActions.find(a => a.type === ACTION_TYPES.RAISE).maxAmount}
                </Text>
              </TouchableOpacity>
            )}
            
            {availableActions.find(a => a.type === ACTION_TYPES.ALL_IN) && (
              <TouchableOpacity
                style={[styles.actionButton, styles.allInButton]}
                onPress={() => executeAction(ACTION_TYPES.ALL_IN)}
              >
                <Text style={styles.actionButtonText}>All-In ${availableActions.find(a => a.type === ACTION_TYPES.ALL_IN).amount}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Bet/Raise Input - Show below all buttons */}
        {showRaiseInput && (
          <View style={styles.raiseInputContainer}>
            <Text style={styles.raiseLabel}>
              {availableActions.find(a => a.type === ACTION_TYPES.BET) ? 'Bet:' : 'Raise TO:'}
            </Text>
            <TextInput
              style={styles.raiseInput}
              placeholder={availableActions.find(a => a.type === ACTION_TYPES.BET) ? '1' : `${gameState.currentBet + (availableActions.find(a => a.type === ACTION_TYPES.RAISE)?.minAmount || 0)}`}
              placeholderTextColor={colors.textMuted}
              value={raiseAmount}
              onChangeText={setRaiseAmount}
              keyboardType="decimal-pad"
            />
            <TouchableOpacity
              style={styles.raiseConfirmButton}
              onPress={availableActions.find(a => a.type === ACTION_TYPES.BET) ? handleBet : handleRaise}
            >
              <Text style={styles.raiseConfirmText}>
                {availableActions.find(a => a.type === ACTION_TYPES.BET) ? 'Bet' : 'Raise'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderActionTimeline = () => {
    if (!gameState?.actions || gameState.actions.length === 0) {
      return null;
    }

    // Show all actions grouped by street like flop component
    const actionsByStreet = {
      preflop: gameState.actions.filter(a => a.street === 'preflop'),
      flop: gameState.actions.filter(a => a.street === 'flop'),
      turn: gameState.actions.filter(a => a.street === 'turn')
    };

    return (
      <View style={cardStyles.container}>
        <Text style={cardStyles.header}>Action Timeline</Text>
        <ScrollView style={styles.timelineContainer} showsVerticalScrollIndicator={false}>
          {/* Preflop Actions */}
          {actionsByStreet.preflop.length > 0 && (
            <View>
              <Text style={styles.streetHeader}>Preflop:</Text>
              {actionsByStreet.preflop.map((action, index) => (
                <View key={`preflop-${index}`} style={styles.timelineItem}>
                  <Text style={[
                    styles.timelineText, 
                    styles.preflopText,
                    action.position === heroPosition && styles.heroTimelineText
                  ]}>
                    {action.position === heroPosition ? 'YOU' : action.position}: {engine?.getHumanReadableAction(action).replace(action.position, '').trim()}
                  </Text>
                </View>
              ))}
            </View>
          )}
          
          {/* Flop Actions */}
          {actionsByStreet.flop.length > 0 && (
            <View>
              <Text style={styles.streetHeader}>Flop:</Text>
              {actionsByStreet.flop.map((action, index) => (
                <View key={`flop-${index}`} style={styles.timelineItem}>
                  <Text style={[
                    styles.timelineText, 
                    styles.flopText,
                    action.position === heroPosition && styles.heroTimelineText
                  ]}>
                    {action.position === heroPosition ? 'YOU' : action.position}: {engine?.getHumanReadableAction(action).replace(action.position, '').trim()}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Turn Actions */}
          {actionsByStreet.turn.length > 0 && (
            <View>
              <Text style={styles.streetHeader}>Turn:</Text>
              {actionsByStreet.turn.map((action, index) => (
                <View key={`turn-${index}`} style={styles.timelineItem}>
                  <Text style={[
                    styles.timelineText,
                    action.position === heroPosition && styles.heroTimelineText
                  ]}>
                    {action.position === heroPosition ? 'YOU' : action.position}: {engine?.getHumanReadableAction(action).replace(action.position, '').trim()}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  const renderControlButtons = () => (
    <View style={cardStyles.container}>
      <Text style={cardStyles.header}>Controls</Text>
      <View style={styles.controlButtonsContainer}>
        <TouchableOpacity
          style={[styles.controlButton, styles.undoButton]}
          onPress={() => {
            console.log('Undo button pressed');
            undoLastAction();
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.controlButtonText}>Undo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.controlButton, styles.clearButton]}
          onPress={() => {
            console.log('Clear button pressed');
            clearAllTurnActions();
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.controlButtonText}>Clear All</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.controlButton, styles.endButton]}
          onPress={() => {
            console.log('Force End button pressed');
            forceEndStreet();
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.controlButtonText}>Force End</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!handData.flopCards || handData.flopCards.length < 3) {
    return (
      <View style={cardStyles.container}>
        <Text style={cardStyles.header}>Turn Action</Text>
        <Text style={styles.setupMessage}>
          Complete the flop action to continue to the turn.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderCardSelector()}
      {renderHeroInfo()}
      {renderBoard()}
      {selectedCard && renderPotAndAction()}
      {renderActionButtons()}
      {renderActionTimeline()}
      {renderControlButtons()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cardSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardHeaderButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  changeCardButton: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  changeCardText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  clearCardButton: {
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  clearCardText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectedCardContainer: {
    marginBottom: spacing.md,
  },
  selectedCardLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  cardSelectedHint: {
    color: colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  changeCardHint: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  selectedCardDisplay: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    alignSelf: 'flex-start',
  },
  cardText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardGrid: {
    maxHeight: 200,
  },
  rankColumn: {
    marginRight: spacing.sm,
    alignItems: 'center',
  },
  rankHeader: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    textAlign: 'center',
    minWidth: 30,
  },
  cardButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    marginVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 30,
    alignItems: 'center',
  },
  cardButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  cardButtonUsed: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
    opacity: 0.5,
  },
  cardButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardButtonTextSelected: {
    color: colors.textPrimary,
  },
  cardButtonTextUsed: {
    color: colors.textPrimary,
    opacity: 0.7,
  },
  boardContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  boardCard: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    minWidth: 50,
  },
  turnCard: {
    borderColor: colors.warning,
    borderWidth: 3,
  },
  boardCardText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  boardCardSuit: {
    fontSize: 20,
    marginTop: -4,
  },
  potActionContainer: {
    ...cardStyles.container,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  potDisplay: {
    alignItems: 'center',
  },
  potLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  potAmount: {
    ...typography.h2,
    color: colors.success,
    fontWeight: 'bold',
  },
  actionIndicator: {
    alignItems: 'center',
  },
  actionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  actionPosition: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: 'bold',
  },
  heroActionPosition: {
    color: colors.success,
  },
  closedIndicator: {
    alignItems: 'center',
  },
  closedText: {
    ...typography.h3,
    color: colors.success,
    fontWeight: 'bold',
  },
  actionButtonsContainer: {
    gap: spacing.sm,
  },
  actionButtonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  foldButton: {
    backgroundColor: colors.danger,
  },
  checkButton: {
    backgroundColor: colors.info,
  },
  callButton: {
    backgroundColor: colors.success,
  },
  betButton: {
    backgroundColor: colors.warning,
  },
  raiseButton: {
    backgroundColor: '#ff6b35', // Slightly different orange for raise vs bet
  },
  allInButton: {
    backgroundColor: colors.primary,
  },
  actionButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  raiseInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  raiseLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  raiseInput: {
    flex: 1,
    ...inputStyles.input,
    marginVertical: 0,
  },
  raiseConfirmButton: {
    backgroundColor: colors.warning,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
  },
  raiseConfirmText: {
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  timelineContainer: {
    maxHeight: 200,
  },
  timelineItem: {
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  timelineText: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  heroTimelineText: {
    color: colors.success,
    fontWeight: 'bold',
  },
  streetHeader: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  preflopText: {
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  flopText: {
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  setupMessage: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  controlButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  controlButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  undoButton: {
    backgroundColor: colors.buttonSecondary,
  },
  clearButton: {
    backgroundColor: colors.danger,
  },
  endButton: {
    backgroundColor: colors.warning,
  },
  controlButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Hero info styles
  heroInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  heroCardsSection: {
    flex: 1,
  },
  heroLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  heroCards: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.success,
    borderRadius: 6,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    minWidth: 35,
  },
  heroCardText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  heroCardSuit: {
    fontSize: 12,
    marginTop: -2,
  },
  heroPositionSection: {
    alignItems: 'center',
  },
  heroPositionChip: {
    backgroundColor: colors.success,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
  },
  heroPositionText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  handStrengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  handStrengthLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  handStrengthChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
  },
  handStrengthText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});