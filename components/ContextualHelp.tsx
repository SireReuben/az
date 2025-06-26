import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { HelpCircle, X } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface HelpContent {
  title: string;
  description: string;
  steps?: string[];
  tips?: string[];
}

interface ContextualHelpProps {
  content: HelpContent;
  position?: 'top' | 'bottom' | 'center';
}

export function ContextualHelp({ content, position = 'center' }: ContextualHelpProps) {
  const [visible, setVisible] = useState(false);

  const showHelp = useCallback(() => setVisible(true), []);
  const hideHelp = useCallback(() => setVisible(false), []);

  return (
    <>
      <TouchableOpacity onPress={showHelp} style={styles.helpButton}>
        <HelpCircle size={20} color="#6b7280" />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={hideHelp}
      >
        <View style={styles.overlay}>
          <Animated.View 
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={[styles.helpModal, styles[position]]}
          >
            <View style={styles.header}>
              <Text style={styles.title}>{content.title}</Text>
              <TouchableOpacity onPress={hideHelp}>
                <X size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
              <Text style={styles.description}>{content.description}</Text>

              {content.steps && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Steps:</Text>
                  {content.steps.map((step, index) => (
                    <Text key={index} style={styles.step}>
                      {index + 1}. {step}
                    </Text>
                  ))}
                </View>
              )}

              {content.tips && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Tips:</Text>
                  {content.tips.map((tip, index) => (
                    <Text key={index} style={styles.tip}>
                      • {tip}
                    </Text>
                  ))}
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  helpButton: {
    padding: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpModal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  top: {
    alignSelf: 'flex-start',
    marginTop: 100,
  },
  bottom: {
    alignSelf: 'flex-end',
    marginBottom: 100,
  },
  center: {
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#374151',
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    lineHeight: 24,
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#374151',
    marginBottom: 8,
  },
  step: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 4,
  },
  tip: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 4,
  },
});