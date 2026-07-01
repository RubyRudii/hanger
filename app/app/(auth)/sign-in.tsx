import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Line, Path, Pattern, Rect } from 'react-native-svg';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Palette } from '@/lib/theme';

export default function SignIn() {
  const { signIn } = useAuth();
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit() {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) Alert.alert('Sign in failed', error);
    else router.replace('/(tabs)/feed');
  }

  return (
    <View style={styles.root}>
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <Pattern id="g" patternUnits="userSpaceOnUse" width={30} height={30}>
              <Line x1="0" y1="0" x2="30" y2="0" stroke={C.gridLine} strokeWidth={1} />
              <Line x1="0" y1="0" x2="0" y2="30" stroke={C.gridLine} strokeWidth={1} />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#g)" />
        </Svg>
      </View>

      <SafeAreaView style={styles.shell}>
        <View style={styles.brandRow}>
          <Text style={styles.logoMark}>HANGER</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>SIGN IN</Text>
          <Text style={styles.sub}>Welcome back, builder.</Text>

          <View style={{ height: 24 }} />
          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            style={[styles.input, focused === 'email' && styles.inputFocus]}
            placeholder="you@example.com"
            placeholderTextColor={C.textDim}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused(null)}
          />

          <View style={{ height: 14 }} />
          <Text style={styles.label}>PASSWORD</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              style={[styles.input, styles.passwordInput, focused === 'password' && styles.inputFocus]}
              placeholder="••••••••"
              placeholderTextColor={C.textDim}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
            />
            <Pressable style={styles.eyeBtn} onPress={() => setShowPassword((v) => !v)} hitSlop={10}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
                  stroke={focused === 'password' ? C.accent : C.textMid}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Circle cx={12} cy={12} r={3} stroke={focused === 'password' ? C.accent : C.textMid} strokeWidth={1.5} />
                {!showPassword ? (
                  <Path
                    d="M4 4l16 16"
                    stroke={focused === 'password' ? C.accent : C.textMid}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                  />
                ) : null}
              </Svg>
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }, loading && { opacity: 0.6 }]}
            onPress={onSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={C.goldLight} />
            ) : (
              <>
                <Text style={styles.btnText}>SIGN IN</Text>
                <Text style={styles.btnArrow}>  →</Text>
              </>
            )}
          </Pressable>

          <Pressable onPress={() => router.replace('/(auth)/sign-up')} style={{ marginTop: 16 }}>
            <Text style={styles.altText}>
              New here? <Text style={{ color: C.accent }}>Create an account</Text>
            </Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>BUILD IT · JUDGE IT · SHOW THE WORLD</Text>
      </SafeAreaView>
    </View>
  );
}

function makeStyles(C: Palette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    shell: { flex: 1, paddingHorizontal: 28, paddingTop: 24, paddingBottom: 32, alignItems: 'center', justifyContent: 'center' },

    corner: { position: 'absolute', width: 36, height: 36, borderColor: C.borderGold },
    cornerTL: { top: 20, left: 20, borderTopWidth: 1, borderLeftWidth: 1 },
    cornerTR: { top: 20, right: 20, borderTopWidth: 1, borderRightWidth: 1 },
    cornerBL: { bottom: 20, left: 20, borderBottomWidth: 1, borderLeftWidth: 1 },
    cornerBR: { bottom: 20, right: 20, borderBottomWidth: 1, borderRightWidth: 1 },

    brandRow: { alignItems: 'center', marginBottom: 24 },
    logoMark: { fontFamily: 'BebasNeue_400Regular', fontSize: 32, letterSpacing: 6, color: C.accent },

    card: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.borderGold,
      borderRadius: 20,
      paddingHorizontal: 24,
      paddingVertical: 28,
    },
    title: { fontFamily: 'BebasNeue_400Regular', fontSize: 32, letterSpacing: 4, color: C.text, textAlign: 'center' },
    sub: { fontSize: 14, color: C.textDim, textAlign: 'center', marginTop: 4, fontFamily: 'DMSans_300Light' },

    label: { fontSize: 12, letterSpacing: 1.5, color: C.textDim, fontFamily: 'DMSans_500Medium', marginBottom: 6 },
    input: {
      backgroundColor: C.surface2,
      borderWidth: 1,
      borderColor: C.borderMid,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: C.text,
      fontFamily: 'DMSans_400Regular',
    },
    inputFocus: { borderColor: C.borderGoldFocus },
    passwordWrap: { position: 'relative', justifyContent: 'center' },
    passwordInput: { paddingRight: 44 },
    eyeBtn: { position: 'absolute', right: 12, alignItems: 'center', justifyContent: 'center', padding: 4 },

    btn: {
      marginTop: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.royalBright,
      borderWidth: 1,
      borderColor: 'rgba(201,168,76,0.4)',
      borderRadius: 30,
      paddingVertical: 14,
    },
    btnText: { fontSize: 15, letterSpacing: 2, color: C.goldLight, fontFamily: 'DMSans_500Medium' },
    btnArrow: { fontSize: 16, color: C.accent, fontFamily: 'DMSans_500Medium' },

    altText: { textAlign: 'center', fontSize: 14, color: C.textMid, fontFamily: 'DMSans_300Light' },

    footer: { marginTop: 28, fontSize: 11, letterSpacing: 3, color: C.textDim, fontFamily: 'DMSans_500Medium' },
  });
}
