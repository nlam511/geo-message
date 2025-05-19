import { useState, useCallback } from 'react';
import {
    Text, StyleSheet, TouchableOpacity, Image,
    ScrollView, View, KeyboardAvoidingView, Platform, TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const router = useRouter();
    useFocusEffect(
        useCallback(() => {
            console.log('Routed to Forgot Password Page');
        }, [])
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                <TouchableOpacity onPress={router.back} style={{ paddingTop: 50 }}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <View style={styles.logocontainer}>
                    <Image
                        source={require('@/assets/images/fishy@3x-80.jpg')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.title}>Droppings</Text>
                </View>
                <View style={styles.form}>
                    <Text style={styles.formLabel}>Forgot Password</Text>
                    <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#999" value={email}
                        onChangeText={setEmail} />
                    <TouchableOpacity style={styles.button}>
                        <Text style={styles.buttonText}>Send Recovery Email</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        padding: 24,
        backgroundColor: 'white',
    },
    logo: {
        width: 150,
        height: 150,
        marginTop: 10
    },
    logocontainer: {
        alignItems: 'center',
        backgroundColor: '',
        marginBottom: 30,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: -10
    },
    form: {
        width: '95%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    formLabel: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    input: {
        height: 44,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 12,
        fontSize: 16,
    },
    button: {
        backgroundColor: 'black',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 5,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    linkText: {
        color: 'black',
        fontSize: 15,
        marginTop: 6,
    },
});


