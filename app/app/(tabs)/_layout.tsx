import { Tabs } from 'expo-router';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { colors, fonts } from '@/lib/theme';

function FeedIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 18 18" fill="none">
      <Rect x={2} y={8} width={6} height={8} rx={1.5} fill={color} />
      <Rect x={10} y={4} width={6} height={12} rx={1.5} fill={color} />
    </Svg>
  );
}
function HangarIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 18 18" fill="none">
      <Rect x={2} y={2} width={6} height={6} rx={1.5} fill={color} />
      <Rect x={10} y={2} width={6} height={6} rx={1.5} fill={color} />
      <Rect x={2} y={10} width={6} height={6} rx={1.5} fill={color} />
      <Rect x={10} y={10} width={6} height={6} rx={1.5} fill={color} />
    </Svg>
  );
}
function JudgeIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 18 18" fill="none">
      <Circle cx={9} cy={9} r={7} stroke={color} strokeWidth={1.5} />
      <Line x1={9} y1={5} x2={9} y2={9} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={9} y1={9} x2={12} y2={11} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}
function ProfileIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 18 18" fill="none">
      <Circle cx={9} cy={7} r={3.5} stroke={color} strokeWidth={1.5} />
      <Path d="M2 16c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: colors.surfaceDeep,
          borderTopColor: 'rgba(255,255,255,0.06)',
          borderTopWidth: 0.5,
          height: 70,
          paddingTop: 8,
          paddingBottom: 14,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: { fontSize: 9, letterSpacing: 1, fontFamily: fonts.bodyMedium },
      }}
    >
      <Tabs.Screen name="feed" options={{ title: 'FEED', tabBarIcon: ({ color }) => <FeedIcon color={color} /> }} />
      <Tabs.Screen name="hangar" options={{ title: 'HANGAR', tabBarIcon: ({ color }) => <HangarIcon color={color} /> }} />
      <Tabs.Screen name="judge" options={{ title: 'JUDGE', tabBarIcon: ({ color }) => <JudgeIcon color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'PROFILE', tabBarIcon: ({ color }) => <ProfileIcon color={color} /> }} />
    </Tabs>
  );
}
