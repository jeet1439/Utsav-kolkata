import { SafeAreaView } from 'react-native-safe-area-context';
import AppMain from './app/App'; 

function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <AppMain />   
    </SafeAreaView>
  );
}

export default App;
