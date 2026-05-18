/**
 * HANGER — App Entry Point
 * 
 * Sets up React Navigation stack so Screen 1 (Splash) can navigate forward.
 * Add new screens to the Stack.Navigator as you build them out.
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from './src/screens/SplashScreen';
// Uncomment as you build each screen:
// import OnboardingScreen from './src/screens/OnboardingScreen';
// import LoginScreen     from './src/screens/LoginScreen';
// import HomeScreen      from './src/screens/HomeScreen';
// import JudgeScreen     from './src/screens/JudgeScreen';
// import ProfileScreen   from './src/screens/ProfileScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        <Stack.Screen name="Splash"      component={SplashScreen} />
        {/* Add screens below as you build them: */}
        {/* <Stack.Screen name="Onboarding" component={OnboardingScreen} /> */}
        {/* <Stack.Screen name="Login"      component={LoginScreen} /> */}
        {/* <Stack.Screen name="Home"       component={HomeScreen} /> */}
        {/* <Stack.Screen name="Judge"      component={JudgeScreen} /> */}
        {/* <Stack.Screen name="Profile"    component={ProfileScreen} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
