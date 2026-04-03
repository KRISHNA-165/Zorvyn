import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Switch, Alert, Platform, Pressable, Modal, ActivityIndicator } from 'react-native';
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
import * as Print from 'expo-print';
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
    transactions,
    isLoading,
    error
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
    try {
      if (transactions.length === 0) {
        Alert.alert("No Data", "There are no transactions to export.");
        return;
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #1a1a1a; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
              .summary { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px; color: #666; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background-color: #f8f9fa; text-align: left; padding: 12px; border-bottom: 2px solid #dee2e6; font-size: 12px; text-transform: uppercase; }
              td { padding: 12px; border-bottom: 1px solid #eee; font-size: 13px; }
              .expense { color: #ef4444; }
              .income { color: #10b981; }
              .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #999; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>The Vault - Transaction Report</h1>
              <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            </div>
            <div class="summary">
              <span>Total Transactions: ${transactions.length}</span>
              <span>Currency: ${currency}</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                ${transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => `
                  <tr>
                    <td>${new Date(t.date).toLocaleDateString()}</td>
                    <td>${t.category}</td>
                    <td class="${t.type}">${t.type.toUpperCase()}</td>
                    <td class="${t.type}">${currency}${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td>${t.note || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="footer">
              <p>Zorvyn x Equilibrium Finance &copy; ${new Date().getFullYear()}</p>
            </div>
          </body>
        </html>
      `;

      if (Platform.OS === 'web') {
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        const link = document.createElement('a');
        link.href = uri;
        link.download = `TheVault_Export_${new Date().getTime()}.pdf`;
        link.click();
      } else {
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert("Export Failed", "We were unable to generate your report. Please try again.");
    }
  };


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Typography variant="h2">Profile & Settings</Typography>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {error ? (
          <Card style={[styles.feedbackCard, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
            <Typography variant="small" color={colors.expense}>{error}</Typography>
          </Card>
        ) : null}

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
                    onPress={async () => {
                      setCurrencyModalVisible(false);
                      await setCurrency(sym);
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

      {isLoading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Typography variant="bodyBold" style={{ marginTop: 12 }}>Processing...</Typography>
        </View>
      ) : null}
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
  },
  feedbackCard: {
    marginBottom: Theme.spacing.md,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 9, 13, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});

