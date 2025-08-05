/**
 * Tier Management Utilities
 * Handles feature availability and upgrade flows based on user subscription tier
 */

export const USER_TIERS = {
  FREE: 'free',
  PLUS: 'plus',
  CRUSHER: 'crusher'
};

export const TIER_FEATURES = {
  [USER_TIERS.FREE]: {
    handsPerSession: 3,
    cloudStorage: false,
    export: false,
    advancedAnalysis: false,
    gtoFeatures: false,
    handDatabase: false,
    handReplayer: false,
    rangeAnalysis: false,
    equityCalculator: false,
    sessionTracking: false,
    displayName: 'Free',
    price: '$0',
    description: 'Perfect for getting started'
  },
  [USER_TIERS.PLUS]: {
    handsPerSession: Infinity,
    cloudStorage: true,
    export: false,
    advancedAnalysis: true,
    gtoFeatures: false,
    handDatabase: false,
    handReplayer: true,
    rangeAnalysis: false,
    equityCalculator: true,
    sessionTracking: true,
    displayName: 'Plus',
    price: '$9.99/mo',
    description: 'Serious players who want detailed analysis'
  },
  [USER_TIERS.CRUSHER]: {
    handsPerSession: Infinity,
    cloudStorage: true,
    export: true,
    advancedAnalysis: true,
    gtoFeatures: true,
    handDatabase: true,
    handReplayer: true,
    rangeAnalysis: true,
    equityCalculator: true,
    sessionTracking: true,
    aiCoach: true,
    customRanges: true,
    exploitFinder: true,
    leakDetection: true,
    winRateProjections: true,
    displayName: 'Crusher Pro',
    price: '$29.99/mo',
    description: 'Elite players who demand the best tools'
  }
};

/**
 * Get features for a specific tier
 * @param {string} tierName - Tier name (free, plus, crusher)
 * @returns {Object} Feature set for the tier
 */
export const getTierFeatures = (tierName) => {
  return TIER_FEATURES[tierName] || TIER_FEATURES[USER_TIERS.FREE];
};

/**
 * Check if a specific feature is available for a tier
 * @param {string} tierName - User's current tier
 * @param {string} featureName - Feature to check
 * @returns {boolean} Whether feature is available
 */
export const hasFeature = (tierName, featureName) => {
  const features = getTierFeatures(tierName);
  return Boolean(features[featureName]);
};

/**
 * Get the next tier up from current tier
 * @param {string} currentTier - Current user tier
 * @returns {string|null} Next tier or null if already at highest
 */
export const getNextTier = (currentTier) => {
  switch (currentTier) {
    case USER_TIERS.FREE:
      return USER_TIERS.PLUS;
    case USER_TIERS.PLUS:
      return USER_TIERS.CRUSHER;
    case USER_TIERS.CRUSHER:
      return null;
    default:
      return USER_TIERS.PLUS;
  }
};

/**
 * Get upgrade messaging for a specific feature
 * @param {string} currentTier - User's current tier
 * @param {string} featureName - Feature they're trying to access
 * @returns {Object} Upgrade message object
 */
export const getUpgradeMessage = (currentTier, featureName) => {
  const nextTier = getNextTier(currentTier);
  if (!nextTier) return null;
  
  const nextTierFeatures = getTierFeatures(nextTier);
  const nextTierName = nextTierFeatures.displayName;
  const nextTierPrice = nextTierFeatures.price;
  
  const featureMessages = {
    advancedAnalysis: {
      title: '🚀 Advanced Analysis',
      description: `Unlock equity calculations, pot odds analysis, and detailed hand breakdowns with ${nextTierName}`,
      buttonText: `Upgrade to ${nextTierName} - ${nextTierPrice}`
    },
    gtoFeatures: {
      title: '🎯 GTO Analysis',
      description: `Get solver recommendations, range analysis, and exploit detection with ${nextTierName}`,
      buttonText: `Upgrade to ${nextTierName} - ${nextTierPrice}`
    },
    export: {
      title: '💾 Export Features',
      description: `Export hands to all major poker tools and platforms with ${nextTierName}`,
      buttonText: `Upgrade to ${nextTierName} - ${nextTierPrice}`
    },
    handDatabase: {
      title: '🗄️ Hand Database',
      description: `Store unlimited hands and search your poker history with ${nextTierName}`,
      buttonText: `Upgrade to ${nextTierName} - ${nextTierPrice}`
    },
    aiCoach: {
      title: '🧠 AI Poker Coach',
      description: `Get personalized coaching and feedback on every decision with ${nextTierName}`,
      buttonText: `Upgrade to ${nextTierName} - ${nextTierPrice}`
    }
  };
  
  return featureMessages[featureName] || {
    title: `🔓 ${nextTierName} Feature`,
    description: `This feature is available with ${nextTierName} subscription`,
    buttonText: `Upgrade to ${nextTierName} - ${nextTierPrice}`
  };
};

/**
 * Get features comparison between current and next tier
 * @param {string} currentTier - User's current tier
 * @returns {Object|null} Comparison object or null if at highest tier
 */
export const getTierComparison = (currentTier) => {
  const nextTier = getNextTier(currentTier);
  if (!nextTier) return null;
  
  const currentFeatures = getTierFeatures(currentTier);
  const nextFeatures = getTierFeatures(nextTier);
  
  // Find new features in next tier
  const newFeatures = Object.keys(nextFeatures).filter(key => 
    !currentFeatures[key] && nextFeatures[key] && 
    !['displayName', 'price', 'description'].includes(key)
  );
  
  return {
    current: currentFeatures,
    next: nextFeatures,
    newFeatures,
    savings: nextTier === USER_TIERS.CRUSHER ? '40%' : null // Example savings
  };
};

/**
 * Format feature names for display
 * @param {string} featureName - Technical feature name
 * @returns {string} Human-readable feature name
 */
export const formatFeatureName = (featureName) => {
  const featureDisplayNames = {
    handsPerSession: 'Hands per Session',
    cloudStorage: 'Cloud Storage',
    export: 'Export to Poker Tools',
    advancedAnalysis: 'Advanced Analysis',
    gtoFeatures: 'GTO Solver Integration',
    handDatabase: 'Unlimited Hand Database',
    handReplayer: 'Interactive Hand Replayer',
    rangeAnalysis: 'Range Analysis',
    equityCalculator: 'Equity Calculator',
    sessionTracking: 'Session Tracking',
    aiCoach: 'AI Poker Coach',
    customRanges: 'Custom Range Builder',
    exploitFinder: 'Exploit Detection',
    leakDetection: 'Leak Detection',
    winRateProjections: 'Win Rate Projections'
  };
  
  return featureDisplayNames[featureName] || featureName;
};

/**
 * Get promotional messaging for Crusher tier
 * @returns {Object} Crusher promotional content
 */
export const getCrusherPromotion = () => {
  return {
    title: '🏆 Crusher Pro Features',
    badge: 'ELITE',
    subtitle: 'Join the top 1% of poker players with professional-grade analysis',
    features: [
      {
        icon: '🎯',
        name: 'GTO Solver Integration',
        description: 'Real solver recommendations for every spot'
      },
      {
        icon: '🧠',
        name: 'AI Poker Coach',
        description: 'Personalized feedback on every decision'
      },
      {
        icon: '🔍',
        name: 'Exploit Detection',
        description: 'Find +EV spots others miss'
      },
      {
        icon: '📊',
        name: 'Range Analysis',
        description: 'Advanced opponent modeling'
      },
      {
        icon: '🚨',
        name: 'Leak Detection',
        description: 'Automatically find costly mistakes'
      },
      {
        icon: '💾',
        name: 'Unlimited Export',
        description: 'Export to all major poker tools'
      }
    ],
    pricing: {
      original: '$49.99',
      current: '$29.99/mo',
      savings: 'Save 40% - Limited Time!'
    },
    guarantee: '💰 30-day money-back guarantee • Cancel anytime',
    testimonials: [
      {
        text: 'Increased my winrate by 3bb/100 in just 2 months',
        author: 'Mike P.'
      },
      {
        text: 'The AI coach is like having Phil Ivey review every hand',
        author: 'Sarah K.'
      }
    ]
  };
};

/**
 * Mock function to get current user tier (replace with actual auth logic)
 * @returns {string} Current user tier
 */
export const getCurrentUserTier = () => {
  // In a real app, this would check authentication/subscription status
  return USER_TIERS.FREE; // Mock default
};

/**
 * Check if user should see upgrade prompts
 * @param {string} tierName - User's current tier
 * @returns {boolean} Whether to show upgrade prompts
 */
export const shouldShowUpgradePrompts = (tierName) => {
  return tierName !== USER_TIERS.CRUSHER;
};