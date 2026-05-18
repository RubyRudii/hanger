import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { colors, fonts } from '@/lib/theme';

export default function SignUp() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!email || !password || !handle) {
      Alert.alert('Missing fields', 'Email, handle and password are required.');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email.trim(), password, handle.trim().toLowerCase());
    setLoading(false);
    if (error) Alert.alert('Sign up failed', error);
    else router.replace('/(tabs)/feed');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.wrap}>
        <Text style={styles.title}>JOIN HANGER</Text>
        <Text style={styles.sub}>Start building your collection.</Text>
        <View style={{ height: 24 }} />
        <TextField label="EMAIL" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <View style={{ height: 12 }} />
        <TextField label="HANDLE" value={handle} onChangeText={setHandle} autoCapitalize="none" placeholder="e.g. zeropilot" />
        <View style={{ height: 12 }} />
        <TextField label="PASSWORD" value={password} onChangeText={setPassword} secureTextEntry />
        <View style={{ height: 24 }} />
        <Button label="CREATE ACCOUNT →" onPress={onSubmit} loading={loading} />
        <Pressable onPress={() => router.replace('/(auth)/sign-in')}>
          <Text style={styles.alt}>
            Have an account? <Text style={{ color: colors.accent }}>Sign in</Text>
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  wrap: { padding: 24, flex: 1 },
  title: { fontFamily: fonts.display, fontSize: 40, letterSpacing: 3, color: colors.text },
  sub: { fontSize: 13, color: colors.textDim, marginTop: 4, fontFamily: fonts.bodyLight },
  alt: { textAlign: 'center', fontSize: 12, color: colors.textDim, marginTop: 18, fontFamily: fonts.body },
});
