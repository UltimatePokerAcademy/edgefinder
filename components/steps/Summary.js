import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { cardStyles, colors, inputStyles, spacing, typography } from '../../styles/theme';

// Import utilities
import {
    calculateHeroContribution,
    getAllActions,
    getHandStats,
    getHandStrengthProgression,
    getReadableAction,
    groupActionsByStreet,
    inferAmountFromResult
} from '../../utils/handAnalysis';

import {
    getCurrentUserTier,
    getTierFeatures,
    hasFeature
} from '../../utils/tierManagement';

// Import Export System
import { createExportSystem } from './summary/ExportSystem';

// Import Tier Features
import { AdvancedAnalysis, GTOFeatures, useFeatureAccess } from './summary/TierFeatures';

const SUIT_COLORS = {
  '♠': '#000000',
  '♣': '#000000', 
  '♥': '#dc3545',
  '♦': '#dc3545',
};

const HAND_TAGS = [
  'Value Bet', 'Bluff', 'Semi-Bluff', 'Slow Play', 'Fast Play',
  'Bad Beat', 'Cooler', 'Mistake', 'Good Fold', 'Good Call',
  'Overbet', 'Underbet', 'Check-Raise', 'Squeeze', 'Float',
  'Barrel', 'Give Up', 'Showdown', 'All-In', 'Hero Call'
];

const RESULT_OPTIONS = [
  { value: 'won', label: 'Won', color: colors.success },
  { value: 'lost', label: 'Lost', color: colors.danger },
  { value: 'chopped', label: 'Chopped', color: colors.info }
];

export default function Summary({ handData, updateHandData, onNext, onPrev }) {
  // State management
  const [selectedTags, setSelectedTags] = useState(handData.tags || []);
  const [handResult, setHandResult] = useState(handData.handResult || '');
  const [amountWon, setAmountWon] = useState(handData.amountWon?.toString() || '');
  const [villainCards, setVillainCards] = useState(handData.villainCards || []);
  const [villainPosition, setVillainPosition] = useState(handData.villainPosition || '');
  const [summaryNotes, setSummaryNotes] = useState(handData.summaryNotes || '');
  const [lessonsLearned, setLessonsLearned] = useState(handData.lessonsLearned || '');
  
  // Get user tier and features
  const currentTier = getCurrentUserTier();
  const features = getTierFeatures(currentTier);
  const featureAccess = useFeatureAccess(currentTier);

  // Calculated values using utilities
  const allActions = getAllActions(handData);
  const heroContribution = calculateHeroContribution(allActions, handData.heroPosition);
  const handStrengthProgression = getHandStrengthProgression(handData);
  const handStats = getHandStats(handData, amountWon);

  // Auto-infer amount won/lost based on hand result
  useEffect(() => {
    if (handResult && !amountWon) {
      const potSize = handData.potSize || 0;
      const inferredAmount = inferAmountFromResult(handResult, potSize, heroContribution);
      
      if (inferredAmount !== 0) {
        setAmountWon(inferredAmount.toFixed(2));
      }
    }
  }, [handResult, handData.potSize, heroContribution, amountWon]);

  // Save hand data when component updates
  useEffect(() => {
    updateHandData({
      tags: selectedTags,
      handResult,
      amountWon: parseFloat(amountWon) || 0,
      villainCards,
      villainPosition,
      summaryNotes,
      lessonsLearned,
      dateCompleted: new Date().toISOString()
    });
  }, [selectedTags, handResult, amountWon, villainCards, villainPosition, summaryNotes, lessonsLearned, updateHandData]);

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const renderHandOverview = () => (
    <View style={cardStyles.container}>
      <Text style={cardStyles.header}>Hand Overview</Text>
      
      <View style={styles.overviewGrid}>
        <View style={styles.overviewItem}>
          <Text style={styles.overviewLabel}>Stake Level</Text>
          <Text style={styles.overviewValue}>{handData.stakeLevel || 'Unknown'}</Text>
        </View>
        
        <View style={styles.overviewItem}>
          <Text style={styles.overviewLabel}>Position</Text>
          <Text style={styles.overviewValue}>{handData.heroPosition || 'Unknown'}</Text>
        </View>
        
        <View style={styles.overviewItem}>
          <Text style={styles.overviewLabel}>Final Pot</Text>
          <Text style={styles.overviewValue}>${handStats.totalPot}</Text>
        </View>
        
        <View style={styles.overviewItem}>
          <Text style={styles.overviewLabel}>Result (BB)</Text>
          <Text style={[
            styles.overviewValue,
            handStats.bbWonLost > 0 ? styles.positiveResult : 
            handStats.bbWonLost < 0 ? styles.negativeResult : styles.neutralResult
          ]}>
            {handStats.bbWonLost > 0 ? '+' : ''}{handStats.bbWonLost} BB
          </Text>
        </View>
      </View>
    </View>
  );

  const renderHandReplay = () => {
    if (allActions.length === 0) return null;

    const actionsByStreet = groupActionsByStreet(allActions);

    return (
      <View style={cardStyles.container}>
        <Text style={cardStyles.header}>Hand Replay</Text>
        
        {/* Hero Cards */}
        {handData.heroCards && handData.heroCards.length === 2 && (
          <View style={styles.replaySection}>
            <Text style={styles.streetTitle}>Hero Cards ({handData.heroPosition})</Text>
            <View style={styles.cardDisplay}>
              {handData.heroCards.map((card, index) => (
                <View key={index} style={styles.heroCard}>
                  <Text style={[styles.cardText, { color: SUIT_COLORS[card[1]] }]}>
                    {card[0]}{card[1]}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Board Cards */}
        <View style={styles.boardSection}>
          <Text style={styles.streetTitle}>Board</Text>
          <View style={styles.boardDisplay}>
            {/* Flop */}
            {handData.flopCards && handData.flopCards.map((card, index) => (
              <View key={`flop-${index}`} style={styles.boardCard}>
                <Text style={[styles.cardText, { color: SUIT_COLORS[card[1]] }]}>
                  {card[0]}{card[1]}
                </Text>
              </View>
            ))}
            
            {/* Turn */}
            {handData.turnCard && (
              <View style={[styles.boardCard, styles.turnCard]}>
                <Text style={[styles.cardText, { color: SUIT_COLORS[handData.turnCard[1]] }]}>
                  {handData.turnCard[0]}{handData.turnCard[1]}
                </Text>
              </View>
            )}
            
            {/* River */}
            {handData.riverCard && (
              <View style={[styles.boardCard, styles.riverCard]}>
                <Text style={[styles.cardText, { color: SUIT_COLORS[handData.riverCard[1]] }]}>
                  {handData.riverCard[0]}{handData.riverCard[1]}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Timeline */}
        <ScrollView style={styles.replayTimeline} showsVerticalScrollIndicator={false}>
          {Object.entries(actionsByStreet).map(([street, actions]) => {
            if (actions.length === 0) return null;
            
            return (
              <View key={street} style={styles.streetActions}>
                <Text style={styles.streetHeader}>{street.charAt(0).toUpperCase() + street.slice(1)}:</Text>
                {actions.map((action, index) => (
                  <View key={index} style={styles.actionItem}>
                    <Text style={[
                      styles.actionText,
                      action.position === handData.heroPosition && styles.heroAction
                    ]}>
                      {action.position === handData.heroPosition ? 'YOU' : action.position}: {getReadableAction(action)}
                    </Text>
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderHandStrengthProgression = () => {
    if (!handStrengthProgression) return null;

    return (
      <View style={cardStyles.container}>
        <Text style={cardStyles.header}>Hand Strength Progression</Text>
        
        {handStrengthProgression.map((stage, index) => (
          <View key={index} style={styles.progressionStage}>
            <View style={styles.progressionHeader}>
              <Text style={styles.progressionStreet}>{stage.street}</Text>
              <Text style={styles.progressionStrength}>{stage.strength}</Text>
            </View>
            <Text style={styles.progressionDescription}>{stage.description}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderHandResult = () => (
    <View style={cardStyles.container}>
      <Text style={cardStyles.header}>Hand Result</Text>
      
      <View style={styles.resultSection}>
        <Text style={styles.resultLabel}>Outcome</Text>
        <View style={styles.resultOptions}>
          {RESULT_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.resultButton,
                handResult === option.value && [styles.resultButtonSelected, { backgroundColor: option.color }]
              ]}
              onPress={() => setHandResult(option.value)}
            >
              <Text style={[
                styles.resultButtonText,
                handResult === option.value && styles.resultButtonTextSelected
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.amountSection}>
        <Text style={styles.resultLabel}>Net Amount Won/Lost ($)</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0.00"
          placeholderTextColor={colors.textMuted}
          value={amountWon}
          onChangeText={setAmountWon}
          keyboardType="decimal-pad"
        />
        <Text style={styles.amountHelper}>
          Amount auto-calculated based on result. Edit if needed.
        </Text>
      </View>
    </View>
  );

  const renderHandTags = () => (
    <View style={cardStyles.container}>
      <Text style={cardStyles.header}>Hand Tags</Text>
      <Text style={styles.tagsSubheader}>Select tags that describe this hand</Text>
      
      <View style={styles.tagsContainer}>
        {HAND_TAGS.map(tag => (
          <TouchableOpacity
            key={tag}
            style={[
              styles.tagButton,
              selectedTags.includes(tag) && styles.tagButtonSelected
            ]}
            onPress={() => toggleTag(tag)}
          >
            <Text style={[
              styles.tagButtonText,
              selectedTags.includes(tag) && styles.tagButtonTextSelected
            ]}>
              {tag}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderNotes = () => (
    <View style={cardStyles.container}>
      <Text style={cardStyles.header}>Analysis & Notes</Text>
      
      <View style={styles.notesSection}>
        <Text style={styles.notesLabel}>Hand Summary</Text>
        <TextInput
          style={[styles.notesInput, styles.summaryNotesInput]}
          placeholder="Describe what happened in this hand..."
          placeholderTextColor={colors.textMuted}
          value={summaryNotes}
          onChangeText={setSummaryNotes}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.notesSection}>
        <Text style={styles.notesLabel}>Key Lessons Learned</Text>
        <TextInput
          style={[styles.notesInput, styles.lessonsInput]}
          placeholder="What did you learn from this hand? What would you do differently?"
          placeholderTextColor={colors.textMuted}
          value={lessonsLearned}
          onChangeText={setLessonsLearned}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>
    </View>
  );

  const renderAdvancedAnalysis = () => (
    <AdvancedAnalysis
      currentTier={currentTier}
      heroContribution={heroContribution}
      handStrengthProgression={handStrengthProgression}
      amountWon={amountWon}
    />
  );

  const renderGTOFeatures = () => (
    <GTOFeatures currentTier={currentTier} />
  );

  const renderActionButtons = () => {
    // Create export system instance
    const exportSystem = createExportSystem(
      handData, 
      selectedTags, 
      summaryNotes, 
      lessonsLearned, 
      handStrengthProgression
    );

    return (
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.backButton]}
          onPress={onPrev}
        >
          <Text style={styles.actionButtonText}>Back to River</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.saveButton]}
          onPress={() => {
            Alert.alert(
              'Hand Saved!',
              `Hand has been saved to ${hasFeature(currentTier, 'cloudStorage') ? 'cloud storage' : 'local storage'}.`,
              [{ text: 'OK' }]
            );
          }}
        >
          <Text style={styles.actionButtonText}>Save Hand</Text>
        </TouchableOpacity>

        {featureAccess.hasExport && (
          <TouchableOpacity
            style={[styles.actionButton, styles.exportButton]}
            onPress={() => exportSystem.showExportOptions()}
          >
            <Text style={styles.actionButtonText}>Export</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderHandOverview()}
      {renderHandReplay()}
      {renderHandStrengthProgression()}
      {renderHandResult()}
      {renderHandTags()}
      {renderNotes()}
      {renderAdvancedAnalysis()}
      {renderGTOFeatures()}
      {renderActionButtons()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Hand Overview
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  overviewItem: {
    width: '48%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  overviewLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  overviewValue: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  positiveResult: {
    color: colors.success,
  },
  negativeResult: {
    color: colors.danger,
  },
  neutralResult: {
    color: colors.textMuted,
  },

  // Hand Replay
  replaySection: {
    marginBottom: spacing.md,
  },
  streetTitle: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  cardDisplay: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  heroCard: {
    backgroundColor: colors.success,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 6,
    minWidth: 45,
    alignItems: 'center',
  },
  cardText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  boardSection: {
    marginBottom: spacing.md,
  },
  boardDisplay: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  boardCard: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 6,
    minWidth: 45,
    alignItems: 'center',
  },
  turnCard: {
    borderColor: colors.warning,
    borderWidth: 3,
  },
  riverCard: {
    borderColor: colors.info,
    borderWidth: 3,
  },
  replayTimeline: {
    maxHeight: 200,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
  },
  streetActions: {
    marginBottom: spacing.md,
  },
  streetHeader: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  actionItem: {
    paddingVertical: spacing.xs,
  },
  actionText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  heroAction: {
    color: colors.success,
    fontWeight: 'bold',
  },

  // Hand Strength Progression
  progressionStage: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  progressionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressionStreet: {
    ...typography.h3,
    color: colors.primary,
  },
  progressionStrength: {
    ...typography.h3,
    color: colors.success,
    fontWeight: 'bold',
  },
  progressionDescription: {
    ...typography.body,
    color: colors.textSecondary,
  },

  // Hand Result
  resultSection: {
    marginBottom: spacing.md,
  },
  resultLabel: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  resultOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  resultButton: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  resultButtonSelected: {
    borderColor: 'transparent',
  },
  resultButtonText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  resultButtonTextSelected: {
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  amountSection: {
    marginTop: spacing.md,
  },
  amountInput: {
    ...inputStyles.input,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  amountHelper: {
    ...typography.small,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  // Hand Tags
  tagsSubheader: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tagButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tagButtonText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tagButtonTextSelected: {
    color: colors.textPrimary,
    fontWeight: 'bold',
  },

  // Notes
  notesSection: {
    marginBottom: spacing.md,
  },
  notesLabel: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  notesInput: {
    ...inputStyles.input,
    textAlignVertical: 'top',
  },
  summaryNotesInput: {
    height: 100,
  },
  lessonsInput: {
    height: 80,
  },

  // Advanced Analysis - moved to TierFeatures
  // Crusher Pro Marketing - moved to TierFeatures  
  // GTO Features - moved to TierFeatures

  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    ...typography.body,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: colors.buttonSecondary,
  },
  saveButton: {
    backgroundColor: colors.success,
  },
  exportButton: {
    backgroundColor: colors.info,
  },
});