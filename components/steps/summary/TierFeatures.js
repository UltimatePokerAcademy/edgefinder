import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { cardStyles, colors, spacing, typography } from '../../../styles/theme';
import {
    getCrusherPromotion,
    getTierFeatures,
    getUpgradeMessage,
    hasFeature
} from '../../../utils/tierManagement';

/**
 * TierFeatures Component
 * Handles all tier-based feature rendering including upgrade prompts
 */

/**
 * Advanced Analysis Section
 * Shows analysis features or upgrade prompt based on tier
 */
export const AdvancedAnalysis = ({ 
  currentTier, 
  heroContribution, 
  handStrengthProgression, 
  amountWon 
}) => {
  if (!hasFeature(currentTier, 'advancedAnalysis')) {
    return <UpgradePrompt currentTier={currentTier} featureName="advancedAnalysis" />;
  }

  // Plus/Crusher tier features
  const getEquityEstimate = (strength) => {
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

  const potOdds = (heroContribution / 100 * 100).toFixed(1); // Simplified calculation
  const equity = handStrengthProgression ? getEquityEstimate(handStrengthProgression[handStrengthProgression.length - 1]?.strength) : '50';
  const ev = (parseFloat(amountWon) || 0).toFixed(2);

  return (
    <View style={cardStyles.container}>
      <Text style={cardStyles.header}>Advanced Analysis</Text>
      
      <View style={styles.analysisGrid}>
        <View style={styles.analysisItem}>
          <Text style={styles.analysisLabel}>Estimated Equity</Text>
          <Text style={styles.analysisValue}>~{equity}%</Text>
        </View>
        
        <View style={styles.analysisItem}>
          <Text style={styles.analysisLabel}>Pot Odds</Text>
          <Text style={styles.analysisValue}>{potOdds}%</Text>
        </View>
        
        <View style={styles.analysisItem}>
          <Text style={styles.analysisLabel}>Hero Investment</Text>
          <Text style={styles.analysisValue}>${heroContribution}</Text>
        </View>
        
        <View style={styles.analysisItem}>
          <Text style={styles.analysisLabel}>Net EV</Text>
          <Text style={[
            styles.analysisValue,
            parseFloat(ev) > 0 ? { color: colors.success } : 
            parseFloat(ev) < 0 ? { color: colors.danger } : {}
          ]}>
            {parseFloat(ev) > 0 ? '+' : ''}${ev}
          </Text>
        </View>
      </View>

      {!hasFeature(currentTier, 'gtoFeatures') && (
        <CrusherUpsell />
      )}
    </View>
  );
};

/**
 * GTO Features Section
 * Shows GTO analysis or Crusher promotion based on tier
 */
export const GTOFeatures = ({ currentTier }) => {
  if (!hasFeature(currentTier, 'gtoFeatures')) {
    return <CrusherPromotion />;
  }

  // Crusher tier GTO features
  return (
    <View style={cardStyles.container}>
      <Text style={cardStyles.header}>🎯 GTO Analysis</Text>
      
      <View style={styles.gtoSection}>
        <Text style={styles.gtoLabel}>Solver Recommendation</Text>
        <Text style={styles.gtoValue}>
          Bet 75% pot (Mixed strategy: 60% bet, 40% check)
        </Text>
      </View>

      <View style={styles.gtoSection}>
        <Text style={styles.gtoLabel}>Range Advantage</Text>
        <Text style={styles.gtoValue}>
          Hero: +12% equity advantage on this texture
        </Text>
      </View>

      <View style={styles.gtoSection}>
        <Text style={styles.gtoLabel}>Exploit Opportunity</Text>
        <Text style={styles.gtoValue}>
          Overbet for value - opponent folds too much
        </Text>
      </View>

      <AICoachSection />
    </View>
  );
};

/**
 * Generic Upgrade Prompt Component
 */
export const UpgradePrompt = ({ currentTier, featureName }) => {
  const upgradeMessage = getUpgradeMessage(currentTier, featureName);
  
  return (
    <View style={cardStyles.container}>
      <View style={styles.upgradePrompt}>
        <Text style={styles.upgradeTitle}>{upgradeMessage.title}</Text>
        <Text style={styles.upgradeDescription}>
          {upgradeMessage.description}
        </Text>
        <TouchableOpacity style={styles.upgradeButton}>
          <Text style={styles.upgradeButtonText}>{upgradeMessage.buttonText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * Crusher Upsell Component (for Plus users)
 */
export const CrusherUpsell = () => (
  <View style={styles.crusherUpsell}>
    <Text style={styles.upsellTitle}>🎯 Want GTO Analysis?</Text>
    <Text style={styles.upsellText}>
      Upgrade to Crusher for solver recommendations, range analysis, and exploit detection
    </Text>
    <TouchableOpacity style={styles.crusherButton}>
      <Text style={styles.crusherButtonText}>Upgrade to Crusher</Text>
    </TouchableOpacity>
  </View>
);

/**
 * Full Crusher Promotion Component
 */
export const CrusherPromotion = () => {
  const crusherPromo = getCrusherPromotion();
  
  return (
    <View style={cardStyles.container}>
      <View style={styles.crusherPromo}>
        <View style={styles.crusherHeader}>
          <Text style={styles.crusherTitle}>{crusherPromo.title}</Text>
          <View style={styles.crusherBadge}>
            <Text style={styles.crusherBadgeText}>{crusherPromo.badge}</Text>
          </View>
        </View>
        
        <Text style={styles.crusherSubtitle}>
          {crusherPromo.subtitle}
        </Text>

        <View style={styles.crusherFeaturesList}>
          {crusherPromo.features.map((feature, index) => (
            <CrusherFeature key={index} feature={feature} />
          ))}
        </View>

        <CrusherPricing pricing={crusherPromo.pricing} />

        <TouchableOpacity style={styles.crusherCTA}>
          <Text style={styles.crusherCTAText}>🚀 Upgrade to Crusher Pro</Text>
        </TouchableOpacity>
        
        <Text style={styles.crusherGuarantee}>
          {crusherPromo.guarantee}
        </Text>
        
        <CrusherTestimonials testimonials={crusherPromo.testimonials} />
      </View>
    </View>
  );
};

/**
 * Individual Crusher Feature Component
 */
const CrusherFeature = ({ feature }) => (
  <View style={styles.crusherFeature}>
    <Text style={styles.crusherFeatureIcon}>{feature.icon}</Text>
    <View style={styles.crusherFeatureContent}>
      <Text style={styles.crusherFeatureName}>{feature.name}</Text>
      <Text style={styles.crusherFeatureDesc}>{feature.description}</Text>
    </View>
  </View>
);

/**
 * Crusher Pricing Component
 */
const CrusherPricing = ({ pricing }) => (
  <View style={styles.crusherPricing}>
    <View style={styles.crusherPriceBox}>
      <Text style={styles.crusherPriceStrike}>{pricing.original}</Text>
      <Text style={styles.crusherPrice}>{pricing.current}</Text>
      <Text style={styles.crusherSavings}>{pricing.savings}</Text>
    </View>
  </View>
);

/**
 * Crusher Testimonials Component
 */
const CrusherTestimonials = ({ testimonials }) => (
  <View style={styles.crusherTestimonials}>
    <Text style={styles.testimonialTitle}>What Crusher users say:</Text>
    {testimonials.map((testimonial, index) => (
      <Text key={index} style={styles.testimonialText}>
        "{testimonial.text}" - {testimonial.author}
      </Text>
    ))}
  </View>
);

/**
 * AI Coach Section Component
 */
const AICoachSection = () => (
  <View style={styles.aiCoachSection}>
    <Text style={styles.aiCoachTitle}>🧠 AI Coach Feedback</Text>
    <Text style={styles.aiCoachFeedback}>
      Excellent value bet sizing on the river. You maximized value against their calling range.
    </Text>
  </View>
);

/**
 * Feature Availability Check Hook
 * Custom hook for checking feature availability
 */
export const useFeatureAccess = (currentTier) => {
  const features = getTierFeatures(currentTier);
  
  return {
    hasAdvancedAnalysis: hasFeature(currentTier, 'advancedAnalysis'),
    hasGTOFeatures: hasFeature(currentTier, 'gtoFeatures'),
    hasExport: hasFeature(currentTier, 'export'),
    hasCloudStorage: hasFeature(currentTier, 'cloudStorage'),
    hasAICoach: hasFeature(currentTier, 'aiCoach'),
    features
  };
};

const styles = StyleSheet.create({
  // Advanced Analysis
  analysisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  analysisItem: {
    width: '48%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  analysisLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  analysisValue: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: 'bold',
  },

  // Upgrade Prompts
  upgradePrompt: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  upgradeTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  upgradeDescription: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 25,
  },
  upgradeButtonText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },

  // Crusher Upsell
  crusherUpsell: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 12,
    marginTop: spacing.md,
    borderWidth: 2,
    borderColor: colors.warning,
  },
  upsellTitle: {
    ...typography.h3,
    color: colors.warning,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  upsellText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  crusherButton: {
    backgroundColor: colors.warning,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    alignSelf: 'center',
  },
  crusherButtonText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },

  // Crusher Promotion
  crusherPromo: {
    padding: spacing.xl,
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.warning,
  },
  crusherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  crusherTitle: {
    ...typography.h1,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  crusherBadge: {
    backgroundColor: colors.warning,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
  },
  crusherBadgeText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 10,
  },
  crusherSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    fontStyle: 'italic',
  },
  crusherFeaturesList: {
    marginBottom: spacing.lg,
  },
  crusherFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 10,
  },
  crusherFeatureIcon: {
    fontSize: 24,
    marginRight: spacing.md,
    width: 30,
    textAlign: 'center',
  },
  crusherFeatureContent: {
    flex: 1,
  },
  crusherFeatureName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  crusherFeatureDesc: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  crusherPricing: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  crusherPriceBox: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.success,
  },
  crusherPriceStrike: {
    ...typography.body,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
    marginBottom: spacing.xs,
  },
  crusherPrice: {
    ...typography.h1,
    color: colors.success,
    fontWeight: 'bold',
    fontSize: 28,
  },
  crusherSavings: {
    ...typography.caption,
    color: colors.success,
    fontWeight: 'bold',
    marginTop: spacing.xs,
  },
  crusherCTA: {
    backgroundColor: colors.success,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  crusherCTAText: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  crusherGuarantee: {
    ...typography.small,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  crusherTestimonials: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  testimonialTitle: {
    ...typography.body,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  testimonialText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: spacing.xs,
  },

  // GTO Features
  gtoSection: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  gtoLabel: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  gtoValue: {
    ...typography.h3,
    color: colors.warning,
    fontWeight: 'bold',
  },
  aiCoachSection: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 12,
    marginTop: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  aiCoachTitle: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  aiCoachFeedback: {
    ...typography.body,
    color: colors.textPrimary,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
  },
});