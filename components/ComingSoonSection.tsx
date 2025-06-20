import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock } from 'lucide-react-native';

interface ComingSoonSectionProps {
  title: string;
  description: string;
}

export function ComingSoonSection({ title, description }: ComingSoonSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Clock size={24} color="#6b7280" />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <Text style={styles.comingSoon}>Coming Soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  iconContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  comingSoon: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#ef4444',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
});