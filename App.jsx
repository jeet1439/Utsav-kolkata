import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Login from "./screens/Login";
import Home from './screens/Home';
import Finder from './screens/Finder';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';

enableScreens();

function App() {
  const Stack = createNativeStackNavigator();
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName='Home'>
        <Stack.Screen name="Home"component={Home} options={{headerShown: false}} />
         <Stack.Screen name="Finder"component={Finder} options={{headerShown: false}}/>
        <Stack.Screen name="Login"component={Login} options={{headerShown: false}}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
