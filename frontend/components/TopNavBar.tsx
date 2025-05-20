import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TopNavBar() {
  const router = useRouter();

  return (
    <View style={styles.navBar}>
      <Text style={styles.title}>Droppings</Text>

      <View style={styles.rightIcon}>
        <Image
          source={require('@/assets/images/fishy@3x-80.jpg')} // Replace with your own image
          style={styles.logoImage}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  leftIcon: {
    position: 'absolute',
    left: 16,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
  },
  rightIcon: {
    position: 'absolute',
    right: 25,
    justifyContent: 'center',
    alignItems: 'center',
    width: 35,
    height: 35,
  },
  logoImage: {
    width: 35,
    height: 35,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 22,
    color: 'black',
    fontFamily: 'ShortStack_400Regular',
  },
});
