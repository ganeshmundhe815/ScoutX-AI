import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

const linking = {
  prefixes: ['http://localhost:8081', 'scoutx://'],
  config: {
    screens: {
      Landing: '',
      Login: 'login',
      Register: 'register',
      Home: 'dashboard',
      RecordUpload: 'upload',
      Messages: 'messages',
      Splash: 'splash',
    },
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer linking={linking}>
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
