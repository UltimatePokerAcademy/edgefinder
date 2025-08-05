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

export default function PreflopAction({ handData, updateHandData }) {
  const [engine, setEngine] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [raiseAmount, setRaiseAmount] = useState('');
  const [showRaiseInput, setShowRaiseInput] = useState(false);
  
  // Hero cards and position
  const [heroCards, setHeroCards] = useState([]);
  const [heroPosition, setHeroPosition] = useState('');
  const [showHeroCardSelector, setShowHeroCardSelector] = useState(true);

  // Initialize poker engine when component mounts or hand data changes
  useEffect(() => {
    if (handData.smallBlind && handData.bigBlind) {
      const config = {
        smallBlind: handData.smallBlind,
        bigBlind: handData.bigBlind,
        straddle: handData.straddle,
        effectiveStack: handData.effectiveStack || 100,
        activePositions: handData.activePositions || ['SB', 'BB', 'UTG', 'MP', 'CO', 'BTN'],
        customStacks: handData.customStacks
      };

      const newEngine = new PokerEngine(config);
      setEngine(newEngine);
      setGameState(newEngine.getGameState());
    }
  }, [handData.smallBlind, handData.bigBlind, handData.straddle, handData.effectiveStack, handData.activePositions, handData.customStacks]);

  // Load existing hero data
  useEffect(() => {
    if (handData.heroCards && handData.heroCards.length === 2) {
      setHeroCards(handData.heroCards);
      setShowHeroCardSelector(false);
    }
    if (handData.heroPosition) {
      setHeroPosition(handData.heroPosition);
    }
  }, [handData.heroCards, handData.heroPosition]);

  const selectHeroCard = (rank, suit) => {
    const card = `${rank}${suit}`;
    
    // Check if card already selected
    if (heroCards.includes(card)) {
      setHeroCards(heroCards.filter(c => c !== card));
    } else if (heroCards.length < 2) {
      const newCards = [...heroCards, card];
      setHeroCards(newCards);
      
      // Auto-hide selector when 2 cards selected
      if (newCards.length === 2) {
        setShowHeroCardSelector(false);
        updateHandData({ heroCards: newCards });
      }
    }
  };

  const clearHeroCards = () => {
    setHeroCards([]);
    setShowHeroCardSelector(true);
    updateHandData({ heroCards: [] });
  };

  const handleHeroPositionSelect = (position) => {
    setHeroPosition(position);
    updateHandData({ heroPosition: position });
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
      
      setGameState({ ...newGameState }); // Force state update with spread
      setShowRaiseInput(false);
      setRaiseAmount('');
      
      // Update parent component with actions
      updateHandData({
        preflopActions: [...newGameState.actions], // Force array update
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

  const undoLastAction = () => {
    console.log('undoLastAction called');
    
    if (!engine || !gameState.actions || gameState.actions.length === 0) {
      console.log('No actions to undo');
      return;
    }

    // Find the last non-blind action (we don't want to undo blinds/straddle)
    const nonBlindActions = gameState.actions.filter(action => 
      action.type !== ACTION_TYPES.POST_BLIND && 
      action.type !== ACTION_TYPES.POST_STRADDLE
    );

    if (nonBlindActions.length === 0) {
      console.log('Cannot undo blinds');
      return;
    }

    console.log('Undoing last action:', nonBlindActions[nonBlindActions.length - 1]);
    
    // Direct undo without Alert for now
    rebuildGameStateWithoutLastAction();
  };

  const rebuildGameStateWithoutLastAction = () => {
    console.log('Rebuilding game state...');
    
    try {
      // Get all actions except the last non-blind one
      const allActions = [...gameState.actions];
      const blindActions = allActions.filter(action => 
        action.type === ACTION_TYPES.POST_BLIND || 
        action.type === ACTION_TYPES.POST_STRADDLE
      );
      const nonBlindActions = allActions.filter(action => 
        action.type !== ACTION_TYPES.POST_BLIND && 
        action.type !== ACTION_TYPES.POST_STRADDLE
      );
      
      console.log('Blind actions:', blindActions.length);
      console.log('Non-blind actions:', nonBlindActions.length);
      
      // Remove the last non-blind action
      const actionsToReplay = nonBlindActions.slice(0, -1);
      console.log('Actions to replay:', actionsToReplay.length);
      
      // Recreate engine
      const config = {
        smallBlind: handData.smallBlind,
        bigBlind: handData.bigBlind,
        straddle: handData.straddle,
        effectiveStack: handData.effectiveStack || 100,
        activePositions: handData.activePositions || ['SB', 'BB', 'UTG', 'MP', 'CO', 'BTN'],
        customStacks: handData.customStacks
      };
      
      const newEngine = new PokerEngine(config);
      
      // Replay non-blind actions
      actionsToReplay.forEach((action, index) => {
        console.log(`Replaying action ${index + 1}:`, action);
        newEngine.executeAction(action.position, action.type, action.amount || 0);
      });
      
      setEngine(newEngine);
      const newGameState = newEngine.getGameState();
      setGameState({ ...newGameState });
      updateHandData({
        preflopActions: [...newGameState.actions],
        potSize: newGameState.pot
      });
      
      console.log('Undo completed successfully');
    } catch (error) {
      console.error('Error during undo:', error);
    }
  };

  const clearAllActions = () => {
    console.log('clearAllActions called');
    
    if (!gameState.actions || gameState.actions.length === 0) {
      console.log('No actions to clear');
      return;
    }

    console.log('Clearing all actions...');
    
    try {
      // Reinitialize engine (this automatically posts blinds/straddle)
      const config = {
        smallBlind: handData.smallBlind,
        bigBlind: handData.bigBlind,
        straddle: handData.straddle,
        effectiveStack: handData.effectiveStack || 100,
        activePositions: handData.activePositions || ['SB', 'BB', 'UTG', 'MP', 'CO', 'BTN'],
        customStacks: handData.customStacks
      };
      
      const newEngine = new PokerEngine(config);
      setEngine(newEngine);
      const newGameState = newEngine.getGameState();
      setGameState({ ...newGameState });
      updateHandData({ 
        preflopActions: [...newGameState.actions], 
        potSize: newGameState.pot 
      });
      
      console.log('Clear completed successfully');
    } catch (error) {
      console.error('Error during clear:', error);
    }
  };

  const forceEndStreet = () => {
    console.log('forceEndStreet called');
    
    if (!engine || gameState.actionClosed) {
      console.log('Action already closed');
      return;
    }

    console.log('Forcing end of street...');
    
    try {
      // Force close the action
      engine.actionClosed = true;
      engine.actionPosition = null;
      const newGameState = engine.getGameState();
      setGameState({ ...newGameState });
      updateHandData({
        preflopActions: [...newGameState.actions],
        potSize: newGameState.pot
      });
      
      console.log('Force end completed successfully');
    } catch (error) {
      console.error('Error during force end:', error);
    }
  };

  const renderHeroCards = () => (
    <View style={cardStyles.container}>
      <View style={styles.heroCardsHeader}>
        <Text style={cardStyles.header}>Your Hole Cards ({heroCards.length}/2)</Text>
        {heroCards.length > 0 && (
          <TouchableOpacity onPress={clearHeroCards} style={styles.clearCardsButton}>
            <Text style={styles.clearCardsText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Selected Cards Display */}
      {heroCards.length > 0 && (
        <View style={styles.selectedCardsContainer}>
          <Text style={styles.selectedCardsLabel}>Your Hand:</Text>
          <View style={styles.selectedCards}>
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
      )}

      {/* Card Grid - Only show if not complete */}
      {showHeroCardSelector && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardGrid}>
          {RANKS.map(rank => (
            <View key={rank} style={styles.rankColumn}>
              <Text style={styles.rankHeader}>{rank}</Text>
              {SUITS.map(suit => {
                const card = `${rank}${suit}`;
                const isSelected = heroCards.includes(card);
                
                return (
                  <TouchableOpacity
                    key={suit}
                    style={[
                      styles.cardButton,
                      isSelected && styles.cardButtonSelected
                    ]}
                    onPress={() => selectHeroCard(rank, suit)}
                    disabled={!isSelected && heroCards.length >= 2}
                  >
                    <Text style={[
                      styles.cardButtonText,
                      { color: SUIT_COLORS[suit] },
                      isSelected && styles.cardButtonTextSelected,
                      !isSelected && heroCards.length >= 2 && styles.cardButtonTextDisabled
                    ]}>
                      {rank}{suit}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderHeroPosition = () => {
    if (!handData.activePositions || handData.activePositions.length === 0) return null;

    return (
      <View style={cardStyles.container}>
        <Text style={cardStyles.header}>Your Position</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {handData.activePositions.map((position) => (
            <TouchableOpacity
              key={position}
              style={[
                styles.positionButton,
                heroPosition === position && styles.positionButtonSelected,
              ]}
              onPress={() => handleHeroPositionSelect(position)}
            >
              <Text style={[
                styles.positionButtonText,
                heroPosition === position && styles.positionButtonTextSelected,
              ]}>
                {position}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {heroPosition && (
          <Text style={styles.positionHelper}>
            You are in the {heroPosition} position
          </Text>
        )}
      </View>
    );
  };

  const renderPotAndAction = () => (
    <View style={styles.potActionContainer}>
      <View style={styles.potDisplay}>
        <Text style={styles.potLabel}>Pot Size</Text>
        <Text style={styles.potAmount}>${gameState?.pot || 0}</Text>
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
    if (!gameState?.actionPosition || gameState.actionClosed) {
      return null;
    }

    const availableActions = gameState.availableActions || [];

    return (
      <View style={cardStyles.container}>
        <Text style={cardStyles.header}>Available Actions</Text>
        
        <View style={styles.actionButtonsContainer}>
          {/* First Row: Fold and Call */}
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

          {/* Second Row: Raise and All-In */}
          <View style={styles.actionButtonRow}>
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
        
        {/* Raise Input - Show below all buttons */}
        {showRaiseInput && (
          <View style={styles.raiseInputContainer}>
            <Text style={styles.raiseLabel}>Raise TO:</Text>
            <TextInput
              style={styles.raiseInput}
              placeholder={`${gameState.currentBet + (gameState.availableActions.find(a => a.type === ACTION_TYPES.RAISE)?.minAmount || 0)}`}
              placeholderTextColor={colors.textMuted}
              value={raiseAmount}
              onChangeText={setRaiseAmount}
              keyboardType="decimal-pad"
            />
            <TouchableOpacity
              style={styles.raiseConfirmButton}
              onPress={handleRaise}
            >
              <Text style={styles.raiseConfirmText}>Raise</Text>
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

    return (
      <View style={cardStyles.container}>
        <Text style={cardStyles.header}>Action Timeline</Text>
        <ScrollView style={styles.timelineContainer} showsVerticalScrollIndicator={false}>
          {gameState.actions.map((action, index) => (
            <View key={index} style={styles.timelineItem}>
              <Text style={[
                styles.timelineText,
                action.position === heroPosition && styles.heroTimelineText
              ]}>
                {action.position === heroPosition ? 'YOU' : action.position}: {engine?.getHumanReadableAction(action).replace(action.position, '').trim()}
              </Text>
            </View>
          ))}
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
            clearAllActions();
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

  if (!gameState) {
    return (
      <View style={cardStyles.container}>
        <Text style={cardStyles.header}>Preflop Action</Text>
        <Text style={styles.setupMessage}>
          Complete the General Info section to begin preflop action.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderHeroCards()}
      {renderHeroPosition()}
      {renderPotAndAction()}
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
  heroCardsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  clearCardsButton: {
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  clearCardsText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectedCardsContainer: {
    marginBottom: spacing.md,
  },
  selectedCardsLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  selectedCards: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.success,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    minWidth: 50,
  },
  heroCardText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  heroCardSuit: {
    fontSize: 16,
    marginTop: -2,
  },
  cardGrid: {
    maxHeight: 250,
  },
  rankColumn: {
    marginRight: spacing.md,
    alignItems: 'center',
  },
  rankHeader: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    textAlign: 'center',
    minWidth: 40,
  },
  cardButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    marginVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  cardButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  cardButtonTextSelected: {
    color: colors.textPrimary,
  },
  cardButtonTextDisabled: {
    opacity: 0.3,
  },
  horizontalScroll: {
    marginVertical: spacing.sm,
  },
  positionButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 60,
    alignItems: 'center',
  },
  positionButtonSelected: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  positionButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  positionButtonTextSelected: {
    color: colors.textPrimary,
  },
  positionHelper: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontStyle: 'italic',
    textAlign: 'center',
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
  raiseButton: {
    backgroundColor: colors.warning,
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
    minHeight: 44, // Ensure minimum touch target
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
});