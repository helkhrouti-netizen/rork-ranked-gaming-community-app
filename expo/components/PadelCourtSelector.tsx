import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { User } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { CourtPosition, Player } from '@/types';

interface PadelCourtSelectorProps {
  selectedPosition?: CourtPosition;
  onSelectPosition: (position: CourtPosition) => void;
  occupiedPositions?: { position: CourtPosition; player: Player }[];
  disabled?: boolean;
  showLabels?: boolean;
}

export function PadelCourtSelector({
  selectedPosition,
  onSelectPosition,
  occupiedPositions = [],
  disabled = false,
  showLabels = true,
}: PadelCourtSelectorProps) {
  const getPositionLabel = (position: CourtPosition): string => {
    switch (position) {
      case 'top-left':
        return 'Left Back';
      case 'top-right':
        return 'Right Back';
      case 'bottom-left':
        return 'Left Front';
      case 'bottom-right':
        return 'Right Front';
    }
  };

  const isPositionOccupied = (position: CourtPosition): boolean => {
    return occupiedPositions.some((op) => op.position === position);
  };

  const getOccupiedPlayer = (position: CourtPosition): Player | undefined => {
    return occupiedPositions.find((op) => op.position === position)?.player;
  };

  const renderPosition = (position: CourtPosition) => {
    const occupied = isPositionOccupied(position);
    const player = getOccupiedPlayer(position);
    const isSelected = selectedPosition === position;
    const isDisabled = disabled || occupied;

    return (
      <TouchableOpacity
        key={position}
        style={[
          styles.position,
          isSelected && styles.positionSelected,
          occupied && styles.positionOccupied,
          isDisabled && !isSelected && styles.positionDisabled,
        ]}
        onPress={() => !isDisabled && onSelectPosition(position)}
        disabled={isDisabled && !isSelected}
        testID={`court-position-${position}`}
      >
        {player ? (
          <View style={styles.playerContainer}>
            {player.avatar ? (
              <Image source={{ uri: player.avatar }} style={styles.playerAvatar} />
            ) : (
              <View style={styles.playerAvatarPlaceholder}>
                <Text style={styles.playerAvatarText}>{player.username[0].toUpperCase()}</Text>
              </View>
            )}
            <Text style={styles.playerName} numberOfLines={1}>
              {player.username}
            </Text>
          </View>
        ) : isSelected ? (
          <View style={styles.selectedContainer}>
            <User color={Colors.colors.primary} size={24} strokeWidth={2.5} />
            <Text style={styles.selectedText}>You</Text>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <User color={Colors.colors.textMuted} size={20} strokeWidth={2} />
          </View>
        )}
        {showLabels && (
          <Text
            style={[
              styles.positionLabel,
              isSelected && styles.positionLabelSelected,
              occupied && styles.positionLabelOccupied,
            ]}
          >
            {getPositionLabel(position)}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.court}>
        <View style={styles.courtNet} />
        
        <View style={styles.courtRow}>
          {renderPosition('top-left')}
          {renderPosition('top-right')}
        </View>

        <View style={styles.courtRow}>
          {renderPosition('bottom-left')}
          {renderPosition('bottom-right')}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  court: {
    backgroundColor: Colors.colors.success + '15',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: Colors.colors.success + '40',
    padding: 16,
    position: 'relative' as const,
  },
  courtNet: {
    position: 'absolute' as const,
    left: 16,
    right: 16,
    top: '50%',
    height: 2,
    backgroundColor: Colors.colors.textMuted,
    transform: [{ translateY: -1 }],
    zIndex: 1,
  },
  courtRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 6,
  },
  position: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: Colors.colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  positionSelected: {
    borderColor: Colors.colors.primary,
    backgroundColor: Colors.colors.primary + '20',
    borderWidth: 3,
  },
  positionOccupied: {
    backgroundColor: Colors.colors.surfaceLight,
    borderColor: Colors.colors.textMuted,
  },
  positionDisabled: {
    opacity: 0.5,
  },
  playerContainer: {
    alignItems: 'center',
    gap: 4,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  playerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerAvatarText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  playerName: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.colors.textPrimary,
    textAlign: 'center',
  },
  selectedContainer: {
    alignItems: 'center',
    gap: 4,
  },
  selectedText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionLabel: {
    position: 'absolute' as const,
    bottom: 4,
    fontSize: 9,
    fontWeight: '600' as const,
    color: Colors.colors.textMuted,
    textAlign: 'center',
  },
  positionLabelSelected: {
    color: Colors.colors.primary,
  },
  positionLabelOccupied: {
    color: Colors.colors.textSecondary,
  },
});
