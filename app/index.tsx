import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    key: '1',
    title: 'WIN DAILY\n10 CRORES',
    subtitle: 'Ye hai India ka Naya Maidan',
    // image: require('../../assets/images/icon.png'), // Placeholder image
  },
  {
    key: '2',
    title: 'PLAY DAILY\n20 + GAMES',
    // subtitle: 'Ye hai India ka Naya Maidan',
    // image: require('../assets/images/icon.png'), // Placeholder image
  },
];

const Welcome = () => {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const ref = useRef(null);

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
    }).current;


  return (
    <LinearGradient
        colors={['#4c0f87', '#3b0c69', '#2b094c']}
        style={styles.container}
    >
        <FlatList
            data={slides}
            renderItem={({ item }) => (
                <View style={styles.slide}>
                    <Image source={item.image} style={styles.image} resizeMode="contain" />
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.subtitle}>{item.subtitle}</Text>
                </View>
            )}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.key}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            ref={ref}
            style={{ flex: 1 }}
        />
        <View style={styles.pagination}>
            {slides.map((_, index) => (
                <View
                    key={index}
                    style={[
                        styles.dot,
                        currentIndex === index ? styles.dotActive : null,
                    ]}
                />
            ))}
        </View>
        <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.buttonText}>Register</Text>
            </TouchableOpacity>
        </View>

    </LinearGradient>
  )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    slide: {
        width: width,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        paddingTop: 100,
    },
    image: {
        width: width * 0.8,
        height: height * 0.4,
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 18,
        color: '#fff',
        textAlign: 'center',
        marginTop: 10,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#fff',
        marginHorizontal: 4,
        opacity: 0.5,
    },
    dotActive: {
        opacity: 1,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 50,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginHorizontal: 20,
    },
    separator: {
        width: 1,
        height: 20,
        backgroundColor: '#fff',
    }
});

export default Welcome; 