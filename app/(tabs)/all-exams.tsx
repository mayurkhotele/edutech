import { apiFetchAuth } from '@/constants/api';
import { AppColors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import ExamCard from '../../components/ExamCard';

export default function AllExamsScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [exams, setExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchExams = async () => {
            if (!user?.token) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const response = await apiFetchAuth('/student/exams', user.token);
                if (response.ok) {
                    setExams(response.data);
                } else {
                    setError(response.data?.message || 'Failed to fetch exams');
                }
            } catch (err: any) {
                setError(err.data?.message || 'An unknown error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchExams();
    }, [user]);

    if (loading) {
        return <ActivityIndicator size="large" color={AppColors.primary} style={styles.centered} />;
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ 
                title: 'All Exams',
                headerStyle: { backgroundColor: AppColors.primary },
                headerTintColor: AppColors.white,
                headerTitleStyle: { fontWeight: 'bold' },
             }} />
            <FlatList
                data={exams}
                renderItem={({ item }) => <ExamCard exam={item} navigation={router} />}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppColors.lightGrey,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: 'red',
        fontSize: 16,
    },
    listContainer: {
        paddingVertical: 10,
    },
}); 