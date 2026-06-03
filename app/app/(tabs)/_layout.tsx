import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

const C = {
  bg: 'rgba(5,9,24,0.92)',
  accent: '#C9A84C',
  inactive: 'rgba(201,168,76,0.45)',
  borderGold: 'rgba(201,168,76,0.22)',
};

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
  const bottomGap = Math.max(insets.bottom, 12);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: C.bg,
          borderTopColor: C.borderGold,
          borderTopWidth: 1,
          height: 70 + bottomGap,
          paddingTop: 10,
          paddingBottom: bottomGap + 10,
        },
        tabBarItemStyle: { paddingVertical: 2 },
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.inactive,
        tabBarLabelStyle: { fontSize: 10, letterSpacing: 1.5, fontFamily: 'DMSans_500Medium', marginTop: 4 },
      }}
    >
      <Tabs.Screen name="feed" options={{ title: 'FEED', tabBarIcon: ({ color }) => <FeedIcon color={color} /> }} />
      <Tabs.Screen name="judge" options={{ title: 'JUDGE', tabBarIcon: ({ color }) => <JudgeIcon color={color} /> }} />
      <Tabs.Screen name="hangar" options={{ title: 'HANGAR', tabBarIcon: ({ color }) => <HangarIcon color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'PROFILE', tabBarIcon: ({ color }) => <ProfileIcon color={color} /> }} />
    </Tabs>
  );
}
