import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { buttonStyles, colors, spacing, typography } from '../styles/theme';

// Import step components (we'll create these next)
import FlopAction from './steps/FlopAction';
import GeneralInfo from './steps/GeneralInfo';
import PreflopAction from './steps/PreflopAction';
import RiverAction from './steps/RiverAction';
import Summary from './steps/Summary';
import TurnAction from './steps/TurnAction';

const STEPS = [
  { id: 1, title: 'General Info', component: GeneralInfo },
  { id: 2, title: 'Preflop', component: PreflopAction },
  { id: 3, title: 'Flop', component: FlopAction },
  { id: 4, title: 'Turn', component: TurnAction },
  { id: 5, title: 'River', component: RiverAction },
  { id: 6, title: 'Summary', component: Summary },
];

export default function HandWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [handData, setHandData] = useState({
    // General Info - Basic Table Setup
    stakeLevel: '',
    smallBlind: 0,
    bigBlind: 0,
    straddle: null, // { position: '', amount: 0 }
    effectiveStack: 0,
    villainType: '',
    generalNotes: '',
    
    // General Info - New Fields
    casino: '',
    location: '',
    gameType: 'cash', // 'cash' or 'tournament'
    rakeStructure: 'percentage_capped', // 'percentage_capped', 'fixed', 'percentage_only'
    rakePercentage: 0, // e.g., 5 for 5%
    rakeCap: 0, // e.g., 5.00 for $5 max
    rakeAmount: 0, // for fixed rake structure
    sessionNotes: '',
    
    // Table Setup (from GeneralInfo)
    tableSize: '9-max',
    activePositions: [],
    customStacks: null,
    
    // Hero Information
    heroPosition: '', // Which position is the hero (e.g., 'BTN', 'CO')
    heroCards: [], // Array of 2 cards like ['As', 'Kh']
    
    // Action data for each street
    preflopActions: [],
    flopActions: [],
    turnActions: [],
    riverActions: [],
    
    // Board cards
    flopCards: [],
    turnCard: null,
    riverCard: null,
    
    // Analysis data (for Summary section)
    villainCards: [], // Array of 2 cards if known
    villainPosition: '', // Which position is the main villain
    handStrength: '', // e.g., "Two Pair, Kings and Sevens"
    potOdds: 0,
    equity: 0,
    tags: [], // Array of tags like ['Bluff', 'Value Bet', 'Bad Beat']
    summaryNotes: '',
    lessonsLearned: '',
    handResult: '', // 'won', 'lost', 'chopped'
    amountWon: 0, // Net result in dollars
    
    // System data
    potSize: 0,
    handId: null, // For future database integration
    dateCreated: new Date().toISOString(),
  });

  const updateHandData = (updates) => {
    setHandData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepNumber) => {
    setCurrentStep(stepNumber);
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {STEPS.map((step) => (
        <TouchableOpacity
          key={step.id}
          style={[
            styles.stepButton,
            currentStep === step.id && styles.stepButtonActive,
            currentStep > step.id && styles.stepButtonCompleted,
          ]}
          onPress={() => goToStep(step.id)}
        >
          <Text style={[
            styles.stepButtonText,
            currentStep === step.id && styles.stepButtonTextActive,
          ]}>
            {step.id}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCurrentStep = () => {
    const currentStepData = STEPS.find(step => step.id === currentStep);
    if (!currentStepData) return null;

    const StepComponent = currentStepData.component;
    return (
      <StepComponent
        handData={handData}
        updateHandData={updateHandData}
        onNext={nextStep}
        onPrev={prevStep}
      />
    );
  };

  const renderNavigationButtons = () => (
    <View style={styles.navigationContainer}>
      <TouchableOpacity
        style={[
          buttonStyles.secondary,
          styles.navButton,
          currentStep === 1 && styles.navButtonDisabled,
        ]}
        onPress={prevStep}
        disabled={currentStep === 1}
      >
        <Text style={[
          buttonStyles.text,
          currentStep === 1 && styles.navButtonTextDisabled,
        ]}>
          Previous
        </Text>
      </TouchableOpacity>

      <Text style={styles.stepTitle}>
        {STEPS.find(step => step.id === currentStep)?.title}
      </Text>

      <TouchableOpacity
        style={[
          buttonStyles.primary,
          styles.navButton,
          currentStep === STEPS.length && styles.navButtonDisabled,
        ]}
        onPress={nextStep}
        disabled={currentStep === STEPS.length}
      >
        <Text style={[
          buttonStyles.text,
          currentStep === STEPS.length && styles.navButtonTextDisabled,
        ]}>
          {currentStep === STEPS.length ? 'Complete' : 'Next'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appTitle}>Edgefinder</Text>
        <Text style={styles.subtitle}>Poker Hand Analyzer</Text>
      </View>

      {renderStepIndicator()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCurrentStep()}
      </ScrollView>

      {renderNavigationButtons()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  appTitle: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  stepButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.xs,
  },
  stepButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepButtonCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  stepButtonText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  stepButtonTextActive: {
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  navButton: {
    minWidth: 80,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonTextDisabled: {
    color: colors.textMuted,
  },
  stepTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
  },
});