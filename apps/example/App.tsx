import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BasicAreaScreen } from './src/screens/BasicAreaScreen';
import { CustomTooltipScreen } from './src/screens/CustomTooltipScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ImperativeZoomScreen } from './src/screens/ImperativeZoomScreen';
import { LiveUpdatingScreen } from './src/screens/LiveUpdatingScreen';
import { SmoothGradientScreen } from './src/screens/SmoothGradientScreen';

export type RootStackParamList = {
  Home: undefined;
  BasicArea: undefined;
  SmoothGradient: undefined;
  LiveUpdating: undefined;
  ImperativeZoom: undefined;
  CustomTooltip: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Home">
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: 'rn-smart-charts' }}
            />
            <Stack.Screen
              name="BasicArea"
              component={BasicAreaScreen}
              options={{ title: 'Basic Area' }}
            />
            <Stack.Screen
              name="SmoothGradient"
              component={SmoothGradientScreen}
              options={{ title: 'Smooth Gradient' }}
            />
            <Stack.Screen
              name="LiveUpdating"
              component={LiveUpdatingScreen}
              options={{ title: 'Live Updating' }}
            />
            <Stack.Screen
              name="ImperativeZoom"
              component={ImperativeZoomScreen}
              options={{ title: 'Imperative Zoom' }}
            />
            <Stack.Screen
              name="CustomTooltip"
              component={CustomTooltipScreen}
              options={{ title: 'Custom Tooltip' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
