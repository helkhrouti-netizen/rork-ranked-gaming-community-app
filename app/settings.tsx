import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  MapPin,
  Camera,
  LogOut,
  FileText,
  ChevronRight,
  X,
  Check,
} from 'lucide-react-native';

import Colors from '@/constants/colors';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { MOROCCO_CITIES, CITY_INFO, MoroccoCity } from '@/constants/cities';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { profile, updateProfile, logout } = useUserProfile();
  const [changeCityModalVisible, setChangeCityModalVisible] = useState(false);
  const [policiesModalVisible, setPoliciesModalVisible] = useState(false);

  const handleChangeCity = async (city: MoroccoCity) => {
    try {
      await updateProfile({ city });
      setChangeCityModalVisible(false);
      Alert.alert('Success', 'City updated successfully');
    } catch {
      Alert.alert('Error', 'Failed to update city');
    }
  };

  const handleChangeProfilePicture = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to change your profile picture.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      try {
        await updateProfile({ profilePicture: base64Image });
        Alert.alert('Success', 'Profile picture updated successfully');
      } catch {
        Alert.alert('Error', 'Failed to update profile picture');
      }
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? This will delete all your local data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/auth/login');
            } catch {
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  if (!profile) {
    return null;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Settings',
          headerStyle: {
            backgroundColor: Colors.colors.surface,
          },
          headerTintColor: Colors.colors.textPrimary,
        }}
      />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 20 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile</Text>
            
            <TouchableOpacity
              style={styles.settingsItem}
              onPress={handleChangeProfilePicture}
            >
              <View style={styles.settingsItemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: Colors.colors.primary + '20' }]}>
                  <Camera color={Colors.colors.primary} size={20} />
                </View>
                <Text style={styles.settingsItemText}>Change Profile Picture</Text>
              </View>
              <ChevronRight color={Colors.colors.textMuted} size={20} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingsItem}
              onPress={() => setChangeCityModalVisible(true)}
            >
              <View style={styles.settingsItemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: Colors.colors.accent + '20' }]}>
                  <MapPin color={Colors.colors.accent} size={20} />
                </View>
                <View style={styles.settingsItemContent}>
                  <Text style={styles.settingsItemText}>City</Text>
                  <Text style={styles.settingsItemSubtext}>
                    {CITY_INFO[profile.city].emoji} {CITY_INFO[profile.city].name}
                  </Text>
                </View>
              </View>
              <ChevronRight color={Colors.colors.textMuted} size={20} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Legal</Text>
            
            <TouchableOpacity
              style={styles.settingsItem}
              onPress={() => setPoliciesModalVisible(true)}
            >
              <View style={styles.settingsItemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: Colors.colors.warning + '20' }]}>
                  <FileText color={Colors.colors.warning} size={20} />
                </View>
                <Text style={styles.settingsItemText}>Policies & Terms</Text>
              </View>
              <ChevronRight color={Colors.colors.textMuted} size={20} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.settingsItem, styles.logoutButton]}
              onPress={handleLogout}
            >
              <View style={styles.settingsItemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: Colors.colors.danger + '20' }]}>
                  <LogOut color={Colors.colors.danger} size={20} />
                </View>
                <Text style={[styles.settingsItemText, styles.logoutText]}>
                  Logout
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <Modal
          visible={changeCityModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setChangeCityModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select City</Text>
                <TouchableOpacity
                  onPress={() => setChangeCityModalVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <X color={Colors.colors.textSecondary} size={24} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                {MOROCCO_CITIES.map((city) => {
                  const cityInfo = CITY_INFO[city];
                  const isSelected = profile.city === city;

                  return (
                    <TouchableOpacity
                      key={city}
                      style={[
                        styles.cityOption,
                        isSelected && styles.cityOptionSelected,
                      ]}
                      onPress={() => handleChangeCity(city)}
                    >
                      <View style={styles.cityOptionLeft}>
                        <Text style={styles.cityEmoji}>{cityInfo.emoji}</Text>
                        <Text style={[
                          styles.cityName,
                          isSelected && styles.cityNameSelected,
                        ]}>
                          {cityInfo.name}
                        </Text>
                      </View>
                      {isSelected && (
                        <Check color={Colors.colors.primary} size={24} strokeWidth={2.5} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal
          visible={policiesModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setPoliciesModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Policies & Terms</Text>
                <TouchableOpacity
                  onPress={() => setPoliciesModalVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <X color={Colors.colors.textSecondary} size={24} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                <View style={styles.policySection}>
                  <Text style={styles.policyTitle}>Terms of Service</Text>
                  <Text style={styles.policyText}>
                    Welcome to our Padel gaming platform. By using this app, you agree to follow fair play rules and respect other players.
                  </Text>
                </View>

                <View style={styles.policySection}>
                  <Text style={styles.policyTitle}>Fair Play Policy</Text>
                  <Text style={styles.policyText}>
                    • All match results must be reported honestly{'\n'}
                    • False score reporting will result in suspension{'\n'}
                    • Respect all players and maintain good sportsmanship{'\n'}
                    • Abusive behavior will not be tolerated
                  </Text>
                </View>

                <View style={styles.policySection}>
                  <Text style={styles.policyTitle}>Rating System</Text>
                  <Text style={styles.policyText}>
                    Players must rate opponents after each match. Ratings help maintain a positive community and are used to calculate reputation scores.
                  </Text>
                </View>

                <View style={styles.policySection}>
                  <Text style={styles.policyTitle}>Dispute Resolution</Text>
                  <Text style={styles.policyText}>
                    If a match score is disputed, all 4 players have 24 hours to submit the correct score. The majority score will be accepted as official.
                  </Text>
                </View>

                <View style={styles.policySection}>
                  <Text style={styles.policyTitle}>Privacy Policy</Text>
                  <Text style={styles.policyText}>
                    Your profile data is stored locally on your device. We respect your privacy and do not share your personal information with third parties.
                  </Text>
                </View>

                <View style={styles.policySection}>
                  <Text style={styles.policyTitle}>Contact</Text>
                  <Text style={styles.policyText}>
                    For any questions or concerns, please contact us at support@padelgaming.ma
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.colors.border,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingsItemContent: {
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsItemText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.colors.textPrimary,
  },
  settingsItemSubtext: {
    fontSize: 14,
    color: Colors.colors.textSecondary,
    marginTop: 2,
  },
  logoutButton: {
    borderColor: Colors.colors.danger + '30',
  },
  logoutText: {
    color: Colors.colors.danger,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: Colors.colors.surfaceLight,
  },
  modalScroll: {
    padding: 20,
  },
  cityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.colors.surfaceLight,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cityOptionSelected: {
    borderColor: Colors.colors.primary,
    backgroundColor: Colors.colors.primary + '10',
  },
  cityOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cityEmoji: {
    fontSize: 24,
  },
  cityName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.colors.textPrimary,
  },
  cityNameSelected: {
    color: Colors.colors.primary,
    fontWeight: '700' as const,
  },
  policySection: {
    marginBottom: 24,
  },
  policyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
    marginBottom: 8,
  },
  policyText: {
    fontSize: 14,
    color: Colors.colors.textSecondary,
    lineHeight: 22,
  },
});
