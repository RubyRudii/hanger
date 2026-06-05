import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Tabs, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTheme } from '@/context/ThemeContext';
import { Palette } from '@/lib/theme';

function FeedIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Rect x={3} y={9} width={6} height={9} rx={1.5} stroke={color} strokeWidth={1.5} />
      <Rect x={11} y={4} width={6} height={14} rx={1.5} stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

function JudgeIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path d="M10 2L11.5 7.5L17 9L11.5 10.5L10 16L8.5 10.5L3 9L8.5 7.5L10 2Z" fill={color} />
      <Path d="M15 14L15.7 16.3L18 17L15.7 17.7L15 20L14.3 17.7L12 17L14.3 16.3L15 14Z" fill={color} opacity={0.7} />
    </Svg>
  );
}

function HangarIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Rect x={3} y={3} width={6} height={6} rx={1.5} stroke={color} strokeWidth={1.5} />
      <Rect x={11} y={3} width={6} height={6} rx={1.5} stroke={color} strokeWidth={1.5} />
      <Rect x={3} y={11} width={6} height={6} rx={1.5} stroke={color} strokeWidth={1.5} />
      <Rect x={11} y={11} width={6} height={6} rx={1.5} stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

function ProfileIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Circle cx={10} cy={7} r={3.5} stroke={color} strokeWidth={1.5} />
      <Path d="M3 18c0-3.5 3.1-6 7-6s7 2.5 7 6" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const bottomGap = Math.max(insets.bottom, 12);
  const tabBarHeight = 70 + bottomGap;
  const fabSize = 64;
  const fabOverlap = 22;
  const inactive = C.accent + '73';

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarStyle: {
            backgroundColor: C.tabBg,
            borderTopColor: C.borderGold,
            borderTopWidth: 1,
            height: tabBarHeight,
            paddingTop: 10,
            paddingBottom: bottomGap + 10,
          },
          tabBarItemStyle: { paddingVertical: 2 },
          tabBarActiveTintColor: C.accent,
          tabBarInactiveTintColor: inactive,
          tabBarLabelStyle: { fontSize: 10, letterSpacing: 1.5, fontFamily: 'DMSans_500Medium', marginTop: 4 },
        }}
      >
        <Tabs.Screen name="feed" options={{ title: 'FEED', tabBarIcon: ({ color }) => <FeedIcon color={color} /> }} />
        <Tabs.Screen
          name="judge"
          options={{
            title: 'JUDGE',
            tabBarIcon: ({ color }) => <JudgeIcon color={color} />,
            tabBarItemStyle: { paddingRight: 36, paddingVertical: 2 },
          }}
        />
        <Tabs.Screen
          name="hangar"
          options={{
            title: 'HANGAR',
            tabBarIcon: ({ color }) => <HangarIcon color={color} />,
            tabBarItemStyle: { paddingLeft: 36, paddingVertical: 2 },
          }}
        />
        <Tabs.Screen name="profile" options={{ title: 'PROFILE', tabBarIcon: ({ color }) => <ProfileIcon color={color} /> }} />
      </Tabs>

      <Pressable
        onPress={() => router.push('/add-kit')}
        style={({ pressed }) => [
          styles.fab,
          {
            width: fabSize,
            height: fabSize,
            borderRadius: fabSize / 2,
            bottom: tabBarHeight - fabOverlap - fabSize / 2,
          },
          pressed && { transform: [{ scale: 0.94 }] },
        ]}
        hitSlop={8}
      >
        <View style={[styles.fabInner, { width: fabSize, height: fabSize, borderRadius: fabSize / 2 }]}>
          <Svg width={26} height={26} viewBox="0 0 24 24">
            <Path d="M12 5V19M5 12H19" stroke={C.goldLight} strokeWidth={2.5} strokeLinecap="round" />
          </Svg>
        </View>
      </Pressable>
    </View>
  );
}

function makeStyles(C: Palette) {
  return StyleSheet.create({
    fab: {
      position: 'absolute',
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: C.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 12,
    },
    fabInner: {
      backgroundColor: C.royalBright,
      borderWidth: 2,
      borderColor: C.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
