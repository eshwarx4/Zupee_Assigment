import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Dimensions,
    Platform,
} from 'react-native';
import TradingChart from '../components/TradingChart';
import { getAssetCategories, mapAssetToSymbol } from '../utils/symbolMapper';
import { chatWithAI } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const INTERVALS = [
    { label: '1m', value: '1' },
    { label: '5m', value: '5' },
    { label: '15m', value: '15' },
    { label: '1H', value: '60' },
    { label: '1D', value: 'D' },
    { label: '1W', value: 'W' },
];

export default function ChartScreen({ navigation, route }) {
    const initialAsset = route?.params?.asset || 'NIFTY 50';
    const initialSymbol = route?.params?.symbol || mapAssetToSymbol(initialAsset);

    const [selectedSymbol, setSelectedSymbol] = useState(initialSymbol);
    const [selectedAssetName, setSelectedAssetName] = useState(initialAsset);
    const [selectedInterval, setSelectedInterval] = useState('D');
    const [selectedCategory, setSelectedCategory] = useState('indices');
    const [aiRecommendation, setAiRecommendation] = useState('');
    const [aiLoading, setAiLoading] = useState(false);

    const categories = getAssetCategories();

    const fetchRecommendation = useCallback(async (assetName) => {
        setAiLoading(true);
        setAiRecommendation('');
        try {
            const data = await chatWithAI(
                `Give a very brief 2-line investment recommendation for ${assetName} in the Indian market. Include current sentiment (bullish/bearish/neutral) and a short reason. Be concise.`
            );
            setAiRecommendation(data.response || data.reply || 'No recommendation available.');
        } catch (e) {
            setAiRecommendation('Unable to fetch recommendation right now.');
        } finally {
            setAiLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRecommendation(selectedAssetName);
    }, [selectedAssetName, fetchRecommendation]);

    const handleAssetSelect = (asset) => {
        setSelectedSymbol(asset.symbol);
        setSelectedAssetName(asset.name);
    };

    const handleInvestNow = () => {
        navigation.navigate('Invest', { symbol: selectedAssetName });
    };

    const currentCategoryAssets = categories.find(c => c.id === selectedCategory)?.assets || [];

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>{selectedAssetName}</Text>
                    <Text style={styles.headerSubtitle}>{selectedSymbol}</Text>
                </View>
            </View>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Chart */}
                <View style={styles.chartContainer}>
                    <TradingChart
                        symbol={selectedSymbol}
                        interval={selectedInterval}
                        theme="dark"
                        height={380}
                    />
                </View>

                {/* Interval Selector */}
                <View style={styles.intervalContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {INTERVALS.map((item) => (
                            <TouchableOpacity
                                key={item.value}
                                style={[
                                    styles.intervalButton,
                                    selectedInterval === item.value && styles.intervalButtonActive,
                                ]}
                                onPress={() => setSelectedInterval(item.value)}
                            >
                                <Text
                                    style={[
                                        styles.intervalText,
                                        selectedInterval === item.value && styles.intervalTextActive,
                                    ]}
                                >
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Category Tabs */}
                <View style={styles.categoryContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {categories.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[
                                    styles.categoryTab,
                                    selectedCategory === cat.id && styles.categoryTabActive,
                                ]}
                                onPress={() => setSelectedCategory(cat.id)}
                            >
                                <Text
                                    style={[
                                        styles.categoryTabText,
                                        selectedCategory === cat.id && styles.categoryTabTextActive,
                                    ]}
                                >
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Asset Chips */}
                <View style={styles.assetChipsContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {currentCategoryAssets.map((asset) => (
                            <TouchableOpacity
                                key={asset.symbol}
                                style={[
                                    styles.assetChip,
                                    selectedSymbol === asset.symbol && styles.assetChipActive,
                                ]}
                                onPress={() => handleAssetSelect(asset)}
                            >
                                <Text
                                    style={[
                                        styles.assetChipText,
                                        selectedSymbol === asset.symbol && styles.assetChipTextActive,
                                    ]}
                                >
                                    {asset.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* AI Recommendation */}
                <View style={styles.aiCard}>
                    <View style={styles.aiHeader}>
                        <Text style={styles.aiIcon}>🤖</Text>
                        <Text style={styles.aiTitle}>AI Recommendation</Text>
                    </View>
                    {aiLoading ? (
                        <ActivityIndicator size="small" color="#FF6B00" style={{ marginTop: 12 }} />
                    ) : (
                        <Text style={styles.aiText}>{aiRecommendation}</Text>
                    )}
                </View>

                {/* Invest Now Button */}
                <TouchableOpacity style={styles.investButton} onPress={handleInvestNow}>
                    <Text style={styles.investButtonText}>Invest in {selectedAssetName} →</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0d0d1a',
    },
    header: {
        backgroundColor: '#1a1a2e',
        paddingTop: Platform.OS === 'ios' ? 56 : 40,
        paddingBottom: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        paddingRight: 12,
        paddingVertical: 4,
    },
    backText: {
        color: '#FF6B00',
        fontSize: 16,
        fontWeight: '600',
    },
    headerTitleContainer: {
        flex: 1,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        color: '#888',
        fontSize: 13,
        marginTop: 2,
    },
    scrollContent: {
        flex: 1,
    },
    chartContainer: {
        marginTop: 8,
    },
    intervalContainer: {
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    intervalButton: {
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#1e1e3a',
        marginRight: 8,
    },
    intervalButtonActive: {
        backgroundColor: '#FF6B00',
    },
    intervalText: {
        color: '#aaa',
        fontSize: 13,
        fontWeight: '600',
    },
    intervalTextActive: {
        color: '#fff',
    },
    categoryContainer: {
        paddingHorizontal: 12,
        marginBottom: 8,
    },
    categoryTab: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 24,
        backgroundColor: '#1e1e3a',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#2a2a4a',
    },
    categoryTabActive: {
        backgroundColor: '#2a1a00',
        borderColor: '#FF6B00',
    },
    categoryTabText: {
        color: '#888',
        fontSize: 14,
        fontWeight: '600',
    },
    categoryTabTextActive: {
        color: '#FF6B00',
    },
    assetChipsContainer: {
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    assetChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: '#151530',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#252545',
    },
    assetChipActive: {
        backgroundColor: '#FF6B00',
        borderColor: '#FF6B00',
    },
    assetChipText: {
        color: '#ccc',
        fontSize: 13,
        fontWeight: '500',
    },
    assetChipTextActive: {
        color: '#fff',
        fontWeight: '700',
    },
    aiCard: {
        marginHorizontal: 16,
        marginTop: 16,
        backgroundColor: '#1a1a2e',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#2a2a4a',
    },
    aiHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    aiIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    aiTitle: {
        color: '#FF6B00',
        fontSize: 16,
        fontWeight: 'bold',
    },
    aiText: {
        color: '#ddd',
        fontSize: 14,
        lineHeight: 22,
        marginTop: 10,
    },
    investButton: {
        marginHorizontal: 16,
        marginTop: 20,
        backgroundColor: '#FF6B00',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#FF6B00',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    investButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
    },
});
