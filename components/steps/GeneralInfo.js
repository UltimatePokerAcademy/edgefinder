import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { cardStyles, colors, inputStyles, spacing, typography } from '../../styles/theme';

const COMMON_STAKES = [
  { label: '$0.25/$0.50', smallBlind: 0.25, bigBlind: 0.50 },
  { label: '$0.50/$1.00', smallBlind: 0.50, bigBlind: 1.00 },
  { label: '$1/$2', smallBlind: 1, bigBlind: 2 },
  { label: '$2/$5', smallBlind: 2, bigBlind: 5 },
  { label: '$5/$10', smallBlind: 5, bigBlind: 10 },
  { label: '$10/$25', smallBlind: 10, bigBlind: 25 },
  { label: '$25/$50', smallBlind: 25, bigBlind: 50 },
  { label: 'Custom', smallBlind: 0, bigBlind: 0 },
];

const VILLAIN_TYPES = [
  'Tight Aggressive (TAG)',
  'Loose Aggressive (LAG)',
  'Tight Passive (Rock)',
  'Loose Passive (Fish)',
  'Maniac',
  'Nit',
  'Regular',
  'Unknown',
  'Custom',
];

const POSITIONS = [
  'UTG', 'UTG+1', 'UTG+2', 'MP', 'MP+1', 'CO', 'BTN', 'SB', 'BB'
];

const RAKE_STRUCTURES = [
  { value: 'percentage_capped', label: '% up to cap (most common)' },
  { value: 'fixed', label: 'Fixed amount' },
  { value: 'percentage_only', label: '% only (no cap)' },
];

// Default presets - empty array, users create their own
const DEFAULT_PRESETS = [];

export default function GeneralInfo({ handData, updateHandData }) {
  const [selectedStake, setSelectedStake] = useState('');
  const [customSmallBlind, setCustomSmallBlind] = useState('');
  const [customBigBlind, setCustomBigBlind] = useState('');
  const [hasStraddle, setHasStraddle] = useState(false);
  const [straddlePosition, setStraddlePosition] = useState('UTG');
  const [straddleAmount, setStraddleAmount] = useState('');
  const [effectiveStack, setEffectiveStack] = useState('');
  const [villainType, setVillainType] = useState('');
  const [customVillainType, setCustomVillainType] = useState('');
  const [notes, setNotes] = useState('');
  
  // New fields
  const [casino, setCasino] = useState('');
  const [location, setLocation] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('custom'); // Default to custom
  const [userPresets, setUserPresets] = useState(DEFAULT_PRESETS);
  const [showRakeInfo, setShowRakeInfo] = useState(false);
  const [rakeStructure, setRakeStructure] = useState('percentage_capped');
  const [rakePercentage, setRakePercentage] = useState('');
  const [rakeCap, setRakeCap] = useState('');
  const [rakeAmount, setRakeAmount] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  
  // Table setup states
  const [showTableSetup, setShowTableSetup] = useState(false);
  const [tableSize, setTableSize] = useState('9-max');
  const [customStacks, setCustomStacks] = useState({});
  const [activePositions, setActivePositions] = useState(POSITIONS);

  const TABLE_SIZES = {
    '6-max': ['SB', 'BB', 'UTG', 'MP', 'CO', 'BTN'],
    '9-max': ['SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'MP', 'MP+1', 'CO', 'BTN']
  };

  // Handle preset selection
  const handlePresetSelection = (presetId) => {
    if (presetId === 'custom') {
      setSelectedPreset('custom');
      return;
    }

    const preset = userPresets.find(p => p.id === presetId);
    if (preset) {
      setSelectedPreset(presetId);
      setCasino(preset.casino);
      setLocation(preset.location);
      setSelectedStake(preset.stakeLevel);
      setRakeStructure(preset.rakeStructure);
      setRakePercentage(preset.rakePercentage?.toString() || '');
      setRakeCap(preset.rakeCap?.toString() || '');
      setRakeAmount(preset.rakeAmount?.toString() || '');
    }
  };

  // Save current settings as a new preset
  const saveAsPreset = () => {
    const presetName = `${casino} ${selectedStake}`.trim() || 'New Preset';
    const newPreset = {
      id: `preset_${Date.now()}`,
      name: presetName,
      casino: casino,
      location: location,
      stakeLevel: selectedStake,
      smallBlind: selectedStake === 'Custom' ? parseFloat(customSmallBlind) : COMMON_STAKES.find(s => s.label === selectedStake)?.smallBlind || 0,
      bigBlind: selectedStake === 'Custom' ? parseFloat(customBigBlind) : COMMON_STAKES.find(s => s.label === selectedStake)?.bigBlind || 0,
      rakeStructure: rakeStructure,
      rakePercentage: parseFloat(rakePercentage) || 0,
      rakeCap: parseFloat(rakeCap) || 0,
      rakeAmount: parseFloat(rakeAmount) || 0,
    };
    
    setUserPresets(prev => [...prev, newPreset]);
    setSelectedPreset(newPreset.id);
  };

  // Auto-fill blinds when stake is selected
  useEffect(() => {
    if (selectedStake && selectedStake !== 'Custom') {
      const stake = COMMON_STAKES.find(s => s.label === selectedStake);
      if (stake) {
        updateHandData({
          stakeLevel: selectedStake,
          smallBlind: stake.smallBlind,
          bigBlind: stake.bigBlind,
        });
      }
    }
  }, [selectedStake]);

  // Update table setup when table size changes
  useEffect(() => {
    const positions = TABLE_SIZES[tableSize];
    setActivePositions(positions);
    
    // Reset custom stacks when table size changes
    const newCustomStacks = {};
    positions.forEach(position => {
      newCustomStacks[position] = customStacks[position] || (parseFloat(effectiveStack) || 100);
    });
    setCustomStacks(newCustomStacks);
  }, [tableSize, effectiveStack]);

  // Update hand data when values change
  useEffect(() => {
    const updates = {
      effectiveStack: parseFloat(effectiveStack) || 100,
      villainType: villainType === 'Custom' ? customVillainType : villainType,
      generalNotes: notes,
      
      // New fields
      casino: casino,
      location: location,
      gameType: 'cash', // Always cash game
      rakeStructure: rakeStructure,
      sessionNotes: sessionNotes,
      
      // Table setup data
      tableSize: tableSize,
      activePositions: activePositions,
      customStacks: showTableSetup ? customStacks : null,
    };

    // Handle custom stakes
    if (selectedStake === 'Custom') {
      updates.smallBlind = parseFloat(customSmallBlind) || 0;
      updates.bigBlind = parseFloat(customBigBlind) || 0;
      updates.stakeLevel = `$${customSmallBlind}/$${customBigBlind}`;
    }

    // Handle straddle
    if (hasStraddle) {
      updates.straddle = {
        position: straddlePosition,
        amount: parseFloat(straddleAmount) || 0,
      };
    } else {
      updates.straddle = null;
    }

    // Handle rake structure
    if (rakeStructure === 'percentage_capped') {
      updates.rakePercentage = parseFloat(rakePercentage) || 0;
      updates.rakeCap = parseFloat(rakeCap) || 0;
      updates.rakeAmount = 0;
    } else if (rakeStructure === 'fixed') {
      updates.rakeAmount = parseFloat(rakeAmount) || 0;
      updates.rakePercentage = 0;
      updates.rakeCap = 0;
    } else if (rakeStructure === 'percentage_only') {
      updates.rakePercentage = parseFloat(rakePercentage) || 0;
      updates.rakeAmount = 0;
      updates.rakeCap = 0;
    }

    updateHandData(updates);
  }, [selectedStake, customSmallBlind, customBigBlind, hasStraddle, straddlePosition, straddleAmount, effectiveStack, villainType, customVillainType, notes, casino, location, rakeStructure, rakePercentage, rakeCap, rakeAmount, sessionNotes, tableSize, activePositions, customStacks, showTableSetup]);

  const updateCustomStack = (position, value) => {
    const stackValue = parseFloat(value) || 0;
    setCustomStacks(prev => ({
      ...prev,
      [position]: stackValue
    }));
  };

  const renderLocationInfo = () => (
    <View style={cardStyles.container}>
      <Text style={cardStyles.header}>Location & Game Setup</Text>
      
      {/* Preset Selection */}
      <View style={inputStyles.container}>
        <Text style={inputStyles.label}>Quick Setup</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {/* Show user's saved presets */}
          {userPresets.map((preset) => (
            <TouchableOpacity
              key={preset.id}
              style={[
                styles.presetButton,
                selectedPreset === preset.id && styles.presetButtonSelected,
              ]}
              onPress={() => handlePresetSelection(preset.id)}
            >
              <Text style={[
                styles.presetButtonText,
                selectedPreset === preset.id && styles.presetButtonTextSelected,
              ]}>
                {preset.name}
              </Text>
            </TouchableOpacity>
          ))}
          
          {/* Always show Custom option */}
          <TouchableOpacity
            style={[
              styles.presetButton,
              (selectedPreset === 'custom' || selectedPreset === '') && styles.presetButtonSelected,
            ]}
            onPress={() => handlePresetSelection('custom')}
          >
            <Text style={[
              styles.presetButtonText,
              (selectedPreset === 'custom' || selectedPreset === '') && styles.presetButtonTextSelected,
            ]}>
              Custom
            </Text>
          </TouchableOpacity>
        </ScrollView>
        
        {/* Save Preset Button - show when user has filled in custom data */}
        {(selectedPreset === 'custom' || selectedPreset === '') && casino && selectedStake && (
          <TouchableOpacity style={styles.savePresetButton} onPress={saveAsPreset}>
            <Text style={styles.savePresetText}>Save as Preset</Text>
          </TouchableOpacity>
        )}
        
        {/* Helper text when no presets exist */}
        {userPresets.length === 0 && (
          <Text style={styles.presetHelper}>
            Fill out your casino and stake info, then save as a preset for quick setup next time!
          </Text>
        )}
      </View>
      
      <View style={inputStyles.container}>
        <Text style={inputStyles.label}>Casino/Cardroom</Text>
        <TextInput
          style={inputStyles.input}
          placeholder="e.g., Bellagio, Aria, Local Home Game"
          placeholderTextColor={colors.textMuted}
          value={casino}
          onChangeText={(text) => {
            setCasino(text);
            setSelectedPreset('custom');
          }}
        />
      </View>

      <View style={inputStyles.container}>
        <Text style={inputStyles.label}>Location</Text>
        <TextInput
          style={inputStyles.input}
          placeholder="e.g., Las Vegas, NV or Online"
          placeholderTextColor={colors.textMuted}
          value={location}
          onChangeText={(text) => {
            setLocation(text);
            setSelectedPreset('custom');
          }}
        />
      </View>
    </View>
  );

  const renderRakeInfo = () => (
    <View style={cardStyles.container}>
      <View style={styles.rakeHeader}>
        <Text style={cardStyles.header}>Rake Information</Text>
        <TouchableOpacity
          style={[styles.toggleButton, showRakeInfo && styles.toggleButtonActive]}
          onPress={() => setShowRakeInfo(!showRakeInfo)}
        >
          <Text style={[
            styles.toggleButtonText,
            showRakeInfo && styles.toggleButtonTextActive,
          ]}>
            {showRakeInfo ? 'HIDE' : 'SHOW'}
          </Text>
        </TouchableOpacity>
      </View>

      {showRakeInfo && (
        <View>
          <View style={inputStyles.container}>
            <Text style={inputStyles.label}>Rake Structure</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {RAKE_STRUCTURES.map((structure) => (
                <TouchableOpacity
                  key={structure.value}
                  style={[
                    styles.rakeStructureButton,
                    rakeStructure === structure.value && styles.rakeStructureButtonSelected,
                  ]}
                  onPress={() => {
                    setRakeStructure(structure.value);
                    setSelectedPreset('custom');
                  }}
                >
                  <Text style={[
                    styles.rakeStructureButtonText,
                    rakeStructure === structure.value && styles.rakeStructureButtonTextSelected,
                  ]}>
                    {structure.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {rakeStructure === 'percentage_capped' && (
            <View style={styles.rakeInputsContainer}>
              <View style={[inputStyles.container, styles.rakeInput]}>
                <Text style={inputStyles.label}>Percentage (%)</Text>
                <TextInput
                  style={inputStyles.input}
                  placeholder="5"
                  placeholderTextColor={colors.textMuted}
                  value={rakePercentage}
                  onChangeText={(text) => {
                    setRakePercentage(text);
                    setSelectedPreset('custom');
                  }}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={[inputStyles.container, styles.rakeInput]}>
                <Text style={inputStyles.label}>Cap ($)</Text>
                <TextInput
                  style={inputStyles.input}
                  placeholder="5.00"
                  placeholderTextColor={colors.textMuted}
                  value={rakeCap}
                  onChangeText={(text) => {
                    setRakeCap(text);
                    setSelectedPreset('custom');
                  }}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          )}

          {rakeStructure === 'fixed' && (
            <View style={inputStyles.container}>
              <Text style={inputStyles.label}>Fixed Rake Amount ($)</Text>
              <TextInput
                style={inputStyles.input}
                placeholder="3.00"
                placeholderTextColor={colors.textMuted}
                value={rakeAmount}
                onChangeText={(text) => {
                  setRakeAmount(text);
                  setSelectedPreset('custom');
                }}
                keyboardType="decimal-pad"
              />
            </View>
          )}

          {rakeStructure === 'percentage_only' && (
            <View style={inputStyles.container}>
              <Text style={inputStyles.label}>Percentage (%)</Text>
              <TextInput
                style={inputStyles.input}
                placeholder="10"
                placeholderTextColor={colors.textMuted}
                value={rakePercentage}
                onChangeText={(text) => {
                  setRakePercentage(text);
                  setSelectedPreset('custom');
                }}
                keyboardType="decimal-pad"
              />
            </View>
          )}

          <Text style={styles.rakeHelper}>
            Most casino cash games use 5% up to $5 cap. Online rooms vary.
          </Text>
        </View>
      )}
    </View>
  );

  const renderStakeSelector = () => (
    <View style={cardStyles.container}>
      <Text style={cardStyles.header}>Stake Level</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        {COMMON_STAKES.map((stake) => (
          <TouchableOpacity
            key={stake.label}
            style={[
              styles.stakeButton,
              selectedStake === stake.label && styles.stakeButtonSelected,
            ]}
            onPress={() => {
              setSelectedStake(stake.label);
              setSelectedPreset('custom');
            }}
          >
            <Text style={[
              styles.stakeButtonText,
              selectedStake === stake.label && styles.stakeButtonTextSelected,
            ]}>
              {stake.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedStake === 'Custom' && (
        <View style={styles.customStakeContainer}>
          <View style={styles.blindInputContainer}>
            <View style={[inputStyles.container, styles.blindInput]}>
              <Text style={inputStyles.label}>Small Blind</Text>
              <TextInput
                style={inputStyles.input}
                placeholder="0.50"
                placeholderTextColor={colors.textMuted}
                value={customSmallBlind}
                onChangeText={(text) => {
                  setCustomSmallBlind(text);
                  setSelectedPreset('custom');
                }}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={[inputStyles.container, styles.blindInput]}>
              <Text style={inputStyles.label}>Big Blind</Text>
              <TextInput
                style={inputStyles.input}
                placeholder="1.00"
                placeholderTextColor={colors.textMuted}
                value={customBigBlind}
                onChangeText={(text) => {
                  setCustomBigBlind(text);
                  setSelectedPreset('custom');
                }}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const renderTableSetup = () => (
    <View style={cardStyles.container}>
      <View style={styles.tableSetupHeader}>
        <Text style={cardStyles.header}>Table Setup</Text>
        <TouchableOpacity
          style={[styles.toggleButton, showTableSetup && styles.toggleButtonActive]}
          onPress={() => setShowTableSetup(!showTableSetup)}
        >
          <Text style={[
            styles.toggleButtonText,
            showTableSetup && styles.toggleButtonTextActive,
          ]}>
            {showTableSetup ? 'ON' : 'OFF'}
          </Text>
        </TouchableOpacity>
      </View>

      {showTableSetup && (
        <View>
          {/* Table Size Selection */}
          <Text style={inputStyles.label}>Table Size</Text>
          <View style={styles.tableSizeContainer}>
            {Object.keys(TABLE_SIZES).map((size) => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.tableSizeButton,
                  tableSize === size && styles.tableSizeButtonSelected,
                ]}
                onPress={() => setTableSize(size)}
              >
                <Text style={[
                  styles.tableSizeButtonText,
                  tableSize === size && styles.tableSizeButtonTextSelected,
                ]}>
                  {size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Active Positions Display */}
          <Text style={[inputStyles.label, { marginTop: spacing.md }]}>Active Positions ({activePositions.length})</Text>
          <View style={styles.activePositionsContainer}>
            {activePositions.map((position) => (
              <View key={position} style={styles.positionChip}>
                <Text style={styles.positionChipText}>{position}</Text>
              </View>
            ))}
          </View>

          {/* Individual Stack Sizes */}
          <Text style={[inputStyles.label, { marginTop: spacing.md }]}>Individual Stack Sizes</Text>
          <Text style={styles.stackHelper}>
            Leave blank to use effective stack for all players
          </Text>
          
          <View style={styles.stackInputsContainer}>
            {activePositions.map((position) => (
              <View key={position} style={styles.stackInputRow}>
                <Text style={styles.stackInputLabel}>{position}:</Text>
                <TextInput
                  style={styles.stackInput}
                  placeholder={effectiveStack || "100"}
                  placeholderTextColor={colors.textMuted}
                  value={customStacks[position]?.toString() || ''}
                  onChangeText={(value) => updateCustomStack(position, value)}
                  keyboardType="decimal-pad"
                />
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.fillAllStacksButton}
            onPress={() => {
              const defaultStack = parseFloat(effectiveStack) || 100;
              const newStacks = {};
              activePositions.forEach(position => {
                newStacks[position] = defaultStack;
              });
              setCustomStacks(newStacks);
            }}
          >
            <Text style={styles.fillAllStacksText}>
              Fill All with Effective Stack (${effectiveStack || 100})
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderStraddleSection = () => (
    <View style={cardStyles.container}>
      <View style={styles.straddleHeader}>
        <Text style={cardStyles.header}>Straddle</Text>
        <TouchableOpacity
          style={[styles.toggleButton, hasStraddle && styles.toggleButtonActive]}
          onPress={() => setHasStraddle(!hasStraddle)}
        >
          <Text style={[
            styles.toggleButtonText,
            hasStraddle && styles.toggleButtonTextActive,
          ]}>
            {hasStraddle ? 'ON' : 'OFF'}
          </Text>
        </TouchableOpacity>
      </View>

      {hasStraddle && (
        <View style={styles.straddleInputs}>
          <View style={[inputStyles.container, styles.straddlePosition]}>
            <Text style={inputStyles.label}>Position</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {POSITIONS.map((position) => (
                <TouchableOpacity
                  key={position}
                  style={[
                    styles.positionButton,
                    straddlePosition === position && styles.positionButtonSelected,
                  ]}
                  onPress={() => setStraddlePosition(position)}
                >
                  <Text style={[
                    styles.positionButtonText,
                    straddlePosition === position && styles.positionButtonTextSelected,
                  ]}>
                    {position}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={[inputStyles.container, styles.straddleAmount]}>
            <Text style={inputStyles.label}>Amount</Text>
            <TextInput
              style={inputStyles.input}
              placeholder="4.00"
              placeholderTextColor={colors.textMuted}
              value={straddleAmount}
              onChangeText={setStraddleAmount}
              keyboardType="decimal-pad"
            />
          </View>
        </View>
      )}
    </View>
  );

  const renderEffectiveStack = () => (
    <View style={cardStyles.container}>
      <Text style={cardStyles.header}>Effective Stack</Text>
      <View style={inputStyles.container}>
        <TextInput
          style={inputStyles.input}
          placeholder="100.00"
          placeholderTextColor={colors.textMuted}
          value={effectiveStack}
          onChangeText={setEffectiveStack}
          keyboardType="decimal-pad"
        />
        <Text style={styles.stackHelper}>
          Enter the smallest stack at the table (in dollars)
        </Text>
      </View>
    </View>
  );

  const renderVillainType = () => (
    <View style={cardStyles.container}>
      <Text style={cardStyles.header}>Villain Type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        {VILLAIN_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.villainButton,
              villainType === type && styles.villainButtonSelected,
            ]}
            onPress={() => setVillainType(type)}
          >
            <Text style={[
              styles.villainButtonText,
              villainType === type && styles.villainButtonTextSelected,
            ]}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {villainType === 'Custom' && (
        <View style={inputStyles.container}>
          <TextInput
            style={inputStyles.input}
            placeholder="Describe the villain..."
            placeholderTextColor={colors.textMuted}
            value={customVillainType}
            onChangeText={setCustomVillainType}
          />
        </View>
      )}
    </View>
  );

  const renderNotes = () => (
    <View style={cardStyles.container}>
      <Text style={cardStyles.header}>Notes</Text>
      <View style={inputStyles.container}>
        <Text style={inputStyles.label}>General Hand Notes</Text>
        <TextInput
          style={[inputStyles.input, styles.notesInput]}
          placeholder="Any additional notes about the hand setup..."
          placeholderTextColor={colors.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <View style={inputStyles.container}>
        <Text style={inputStyles.label}>Session Notes</Text>
        <TextInput
          style={[inputStyles.input, styles.notesInput]}
          placeholder="Notes about the session, table dynamics, etc..."
          placeholderTextColor={colors.textMuted}
          value={sessionNotes}
          onChangeText={setSessionNotes}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderLocationInfo()}
      {renderStakeSelector()}
      {renderRakeInfo()}
      {renderTableSetup()}
      {renderStraddleSection()}
      {renderEffectiveStack()}
      {renderVillainType()}
      {renderNotes()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  horizontalScroll: {
    marginVertical: spacing.sm,
  },
  presetButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 100,
    alignItems: 'center',
  },
  presetButtonSelected: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  presetButtonText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  presetButtonTextSelected: {
    color: colors.textPrimary,
  },
  savePresetButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  savePresetText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  presetHelper: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.sm,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  rakeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  rakeStructureButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 120,
    alignItems: 'center',
  },
  rakeStructureButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  rakeStructureButtonText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  rakeStructureButtonTextSelected: {
    color: colors.textPrimary,
  },
  rakeInputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  rakeInput: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  rakeHelper: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.sm,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  stakeButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stakeButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stakeButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  stakeButtonTextSelected: {
    color: colors.textPrimary,
  },
  customStakeContainer: {
    marginTop: spacing.md,
  },
  blindInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  blindInput: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  tableSetupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tableSizeContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tableSizeButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tableSizeButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tableSizeButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  tableSizeButtonTextSelected: {
    color: colors.textPrimary,
  },
  activePositionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  positionChip: {
    backgroundColor: colors.info,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
  },
  positionChipText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  stackInputsContainer: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  stackInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stackInputLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    minWidth: 50,
  },
  stackInput: {
    ...inputStyles.input,
    flex: 1,
    marginLeft: spacing.sm,
    marginVertical: 0,
  },
  fillAllStacksButton: {
    backgroundColor: colors.info,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  fillAllStacksText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  straddleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  toggleButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleButtonActive: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  toggleButtonText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  toggleButtonTextActive: {
    color: colors.textPrimary,
  },
  straddleInputs: {
    flexDirection: 'column',
  },
  straddlePosition: {
    marginBottom: spacing.md,
  },
  straddleAmount: {
    flex: 1,
  },
  positionButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 6,
    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  positionButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  positionButtonText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  positionButtonTextSelected: {
    color: colors.textPrimary,
  },
  stackHelper: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  villainButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  villainButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  villainButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  villainButtonTextSelected: {
    color: colors.textPrimary,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
});