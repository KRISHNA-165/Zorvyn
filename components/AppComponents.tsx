import React from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  StyleSheet, 
  ViewStyle, 
  TextStyle, 
  Platform,
  ActivityIndicator
} from 'react-native';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import { Theme, Colors, ColorTheme } from '../constants/Theme';
import { useFinanceStore } from '../store/useFinanceStore';

/**
 * Hook to get current theme colors
 */
export const useThemeColors = (): ColorTheme => {
  const theme = useFinanceStore((state) => state.theme) || 'dark';
  return Colors[theme] || Colors.dark;
};

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | any;
  variant?: 'outline' | 'flat' | 'elevated' | 'glass';
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'elevated', onPress }) => {
  const colors = useThemeColors();
  const isWeb = Platform.OS === 'web';
  
  const Container: any = (isWeb || !onPress) ? View : Animated.View;
  const animationProps = isWeb ? {} : {
    entering: FadeInUp.duration(600).springify(),
    layout: Layout.springify()
  };

  const cardStyle = [
    styles.card, 
    { backgroundColor: colors.card },
    variant === 'outline' && { ...styles.cardOutline, borderColor: colors.border },
    variant === 'glass' && { ...styles.cardGlass, borderColor: 'rgba(255,255,255,0.1)' },
    style
  ];

  if (onPress) {
    return (
      <Pressable 
        onPress={() => {
          console.log('[Card] Press detected');
          onPress();
        }}
        style={({ pressed }) => [
          cardStyle,
          pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
        ]}
      >
        {children}
      </Pressable>
    );
  }
  
  return (
    <Container {...animationProps} style={cardStyle}>
      {children}
    </Container>
  );
};

interface TypographyProps {
  children: React.ReactNode;
  style?: TextStyle | any;
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'bodyBold' | 'label' | 'small';
  color?: string;
  align?: 'left' | 'center' | 'right';
  animated?: boolean;
  size?: number;
}

export const Typography: React.FC<TypographyProps> = ({ 
  children, 
  style, 
  variant = 'body', 
  color,
  align,
  animated = false,
  size
}) => {
  const colors = useThemeColors();
  const baseStyle = Theme.typography[variant] as TextStyle;
  
  const isWeb = Platform.OS === 'web';
  const Component: any = (animated && !isWeb) ? Animated.Text : Text;
  const entering = (animated && !isWeb) ? FadeInUp.delay(100).duration(400) : undefined;

  return (
    <Component 
      entering={entering}
      style={[
        baseStyle, 
        { color: color || (variant === 'body' || variant === 'label' || variant === 'small' ? colors.textSecondary : colors.text) },
        align ? { textAlign: align } : {},
        size ? { fontSize: size } : {},
        style
      ]}
    >
      {children}
    </Component>
  );
};

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  style?: ViewStyle | any;
  textStyle?: TextStyle | any;
  icon?: React.ReactNode;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  style,
  textStyle,
  icon,
  loading = false
}) => {
  const colors = useThemeColors();

  const getButtonStyle = () => {
    switch (variant) {
      case 'primary': return { backgroundColor: colors.primary };
      case 'secondary': return { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border };
      case 'outline': return { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary };
      case 'ghost': return { backgroundColor: 'transparent' };
      default: return { backgroundColor: colors.primary };
    }
  };

  const getTextColor = () => {
    if (variant === 'outline' || variant === 'ghost') return colors.primary;
    if (variant === 'secondary') return colors.text;
    return '#FFFFFF';
  };

  return (
    <Pressable 
      onPress={loading ? undefined : onPress} 
      style={({ pressed }) => [
        styles.btnBase, 
        getButtonStyle(), 
        pressed && { opacity: 0.7 },
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <>
          {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
          <Text style={[
            styles.btnText, 
            { color: getTextColor() },
            textStyle
          ]}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
      }
    }) as any,
  },
  cardOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    elevation: 0,
  },
  cardGlass: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderWidth: 1,
  } as ViewStyle,
  btnBase: {
    height: 52,
    borderRadius: Theme.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Theme.spacing.lg,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        userSelect: 'none',
      }
    }) as any,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
