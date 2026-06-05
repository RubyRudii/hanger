import { Stack } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';

export default function AuthLayout() {
  const { colors: C } = useTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }} />;
}
