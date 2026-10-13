import React, { useState } from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../constants/theme';

/**
 * Robust Football Image with Fallback Pattern
 * Renders remote photography or a sports turf pattern if offline/loading fails.
 */
export default function FootballImage({ source, style, title, icon = 'football', resizeMode = 'cover' }) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !source || !source.uri) {
    return (
      <View style={[styles.fallbackContainer, style]}>
        <View style={styles.pitchLines}>
          <View style={styles.centerCircle} />
          <View style={styles.penaltyBox} />
        </View>
        <Ionicons name={icon} size={36} color={COLORS.primaryLight} style={styles.icon} />
        {title ? <Text style={styles.fallbackTitle}>{title}</Text> : null}
      </View>
    );
  }

  return (
    <Image
      source={source}
      style={style}
      resizeMode={resizeMode}
      onError={() => setHasError(true)}
    />
  );
}

const styles = StyleSheet.create({
  fallbackContainer: {
    backgroundColor: '#0F291E', // Dark turf green
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    borderRadius: RADIUS.md,
  },
  pitchLines: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.15,
  },
  centerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  penaltyBox: {
    position: 'absolute',
    top: 0,
    width: 140,
    height: 60,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: '#FFFFFF',
  },
  icon: {
    marginBottom: 8,
    opacity: 0.85,
  },
  fallbackTitle: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
});
