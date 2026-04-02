import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Switch, Alert, Platform, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  User, 
  Moon, 
  Sun, 
  DollarSign, 
  Fingerprint, 
  Bell, 
  FileDown, 
  ShieldCheck,
  ChevronRight,
  LogOut,
  Info
} from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as LocalAuthentication from 'expo-local-authentication';

import Theme from '@/constants/Theme';
import { Card, Typography, useThemeColors } from '@/components/AppComponents';
import { useFinanceStore, CurrencySymbol, TransactionType } from '@/store/useFinanceStore';

const SettingItem = ({ 
  icon, 
  title, 
  subtitle, 
  colors,
  onPress,
  value,
  onToggle
}: { 
  icon: React.ReactNode, 
  title: string, 
  subtitle: string, 
  colors: any,
  onPress?: () => void,
  value?: boolean,
  onToggle?: (val: boolean) => void
}) => {
  const isWeb = Platform.OS === 'web';
  return (
    <Card 
      style={styles.settingItem} 
      variant="outline" 
      onPress={onToggle ? () => onToggle(!value) : onPress}
    >
      <View style={[styles.iconBox, { backgroundColor: colors.background }]} pointerEvents="none">
        {icon}
      </View>
      <View style={{ flex: 1 }} pointerEvents="none">
        <Typography variant="bodyBold">{title}</Typography>
        <Typography variant="small">{subtitle}</Typography>
      </View>
      {onToggle !== undefined && (
        <View 
          pointerEvents={isWeb ? "none" : "auto"}
          style={isWeb ? { opacity: 0.8 } : undefined}
        >
          <Switch 
            value={value} 
            onValueChange={onToggle}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={isWeb ? undefined : (value ? 'white' : colors.textSecondary)}
            style={isWeb ? { cursor: 'pointer' } as any : undefined}
          />
        </View>
      )}
      {onPress !== undefined && onToggle === undefined && (
        <View pointerEvents="none">
          <ChevronRight size={20} color={colors.textSecondary} />
        </View>
      )}
    </Card>
  );
};

export default function ProfileScreen() {
  const colors = useThemeColors();
  const { 
    theme, setTheme, 
    currency, setCurrency,
    biometricsEnabled, toggleBiometrics,
    notificationsEnabled, toggleNotifications,
    transactions
  } = useFinanceStore();
  
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  
  React.useEffect(() => {
    console.log(`[ProfileScreen] Theme updated to: ${theme}`);
  }, [theme]);

  const handleBiometricToggle = async () => {
    if (Platform.OS === 'web') {
      toggleBiometrics();
      return;
    }
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      Alert.alert("Not Supported", "Your device does not support biometric authentication.");
      return;
    }
    toggleBiometrics();
  };

  const handleExport = async () => {
    const docDir = (FileSystem as any).documentDirectory;
    if (!docDir) {
      Alert.alert("Error", "Export is only available on native devices.");
      return;
    }
    const fileUri = docDir + 'transactions.csv';
    const csvContent = [
      ['Date', 'Type', 'Amount', 'Category', 'Note'],
      ...transactions.map(t => [t.date, t.type, t.amount, t.category, t.note])
    ].map(e => e.join(",")).join("\n");

    await FileSystem.writeAsStringAsync(fileUri, csvContent);
    await Sharing.shareAsync(fileUri);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Typography variant="h2">Profile & Settings</Typography>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* User Card */}
        <Card style={styles.userCard}>
          <View style={[styles.avatarBox, { backgroundColor: colors.primary }]}>
            <User size={32} color="white" />
          </View>
          <View style={{ flex: 1 }}>
            <Typography variant="h3">The Vault</Typography>
            <Typography variant="small">Premium Companion Active</Typography>
          </View>
          <View style={styles.statusBadge}>
            <ShieldCheck size={14} color={colors.primary} />
            <Typography variant="small" color={colors.primary} style={{ marginLeft: 4 }}>Verified</Typography>
          </View>
        </Card>

        <Typography variant="label" style={styles.sectionLabel}>PREFERENCES</Typography>
        
        <SettingItem
          colors={colors}
          icon={theme === 'dark' ? <Moon size={20} color={colors.primary} /> : <Sun size={20} color={colors.accent} />}
          title="Dark Mode"
          subtitle={`Currently ${theme === 'dark' ? 'enabled' : 'disabled'}`}
          value={theme === 'dark'} 
          onToggle={(val) => setTheme(val ? 'dark' : 'light')}
        />

        <SettingItem
          colors={colors}
          icon={<DollarSign size={20} color={colors.income} />}
          title="Primary Currency"
          subtitle={`Using ${currency}`}
          onPress={() => setCurrencyModalVisible(true)}
        />

        <Typography variant="label" style={styles.sectionLabel}>SECURITY & DATA</Typography>

        <SettingItem 
          colors={colors}
          icon={<Fingerprint size={20} color={colors.secondary} />}
          title="Biometric Lock"
          subtitle="Secure app entry"
          value={biometricsEnabled} 
          onToggle={handleBiometricToggle}
        />

        <SettingItem
          colors={colors}
          icon={<Bell size={20} color={colors.accent} />}
          title="Notifications"
          subtitle="Daily savings reminders"
          value={notificationsEnabled} 
          onToggle={toggleNotifications}
        />

        <SettingItem
          colors={colors}
          icon={<FileDown size={20} color={colors.primary} />}
          title="Export Transactions"
          subtitle="Download CSV report"
          onPress={handleExport}
        />

        <Typography variant="label" style={styles.sectionLabel}>ABOUT</Typography>

        <Pressable style={styles.listBtn}>
          <Info size={20} color={colors.textSecondary} />
          <Typography variant="body" style={{ flex: 1, marginLeft: 12 }}>Versioning & Licenses</Typography>
          <ChevronRight size={20} color={colors.textSecondary} />
        </Pressable>

        <Pressable style={[styles.listBtn, { marginTop: 12 }]}>
          <LogOut size={20} color={colors.expense} />
          <Typography variant="body" color={colors.expense} style={{ flex: 1, marginLeft: 12 }}>Sign Out</Typography>
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Currency Selection Modal */}
      <Modal
        visible={currencyModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCurrencyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.modalContent}>
            <Typography variant="h3" style={{ marginBottom: 16 }}>Select Currency</Typography>
            <ScrollView style={{ maxHeight: 300 }} indicatorStyle="white">
              {(['$', '€', '£', '¥', '₹', 'A$', 'C$', 'CHF', '₩'] as CurrencySymbol[]).map((sym) => {
                const labels: Record<string, string> = {
                  '$': 'USD ($)',
                  '€': 'Euro (€)',
                  '£': 'GBP (£)',
                  '¥': 'JPY (¥)',
                  '₹': 'Rupee (₹)',
                  'A$': 'AUD (A$)',
                  'C$': 'CAD (C$)',
                  'CHF': 'Franc (CHF)',
                  '₩': 'Won (₩)'
                };
                
                return (
                  <Pressable
                    key={sym}
                    style={[
                      styles.currencyOptionBtn, 
                      { borderColor: colors.border },
                      currency === sym && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                    onPress={() => {
                      setCurrencyModalVisible(false);
                      setCurrency(sym);
                    }}
                  >
                    <Typography variant="bodyBold" color={currency === sym ? 'white' : colors.text}>
                      {labels[sym]}
                    </Typography>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable 
              style={[styles.currencyOptionBtn, { marginTop: 12, backgroundColor: colors.border, borderWidth: 0 }]} 
              onPress={() => setCurrencyModalVisible(false)}
            >
              <Typography variant="bodyBold">Cancel</Typography>
            </Pressable>
          </Card>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Theme.spacing.md,
  },
  scrollContent: {
    padding: Theme.spacing.md,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
    gap: Theme.spacing.md,
  },
  avatarBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectionLabel: {
    marginBottom: Theme.spacing.md,
    marginTop: Theme.spacing.sm,
    letterSpacing: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  settingInfo: {
    flex: 1,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  listBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.sm,
    ...Platform.select({ web: { cursor: 'pointer' } }) as any,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Theme.spacing.lg,
  },
  modalContent: {
    padding: Theme.spacing.xl,
  },
  currencyOptionBtn: {
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    marginBottom: 8,
    alignItems: 'center',
  }
});
