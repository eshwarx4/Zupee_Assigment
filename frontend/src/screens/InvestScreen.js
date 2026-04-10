import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Linking } from 'react-native';
import { placeOrder, getPortfolio, disconnectZerodha } from '../services/api';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';

const ORDER_TYPES = ['BUY', 'SELL'];
const PRODUCT_TYPES = ['CNC', 'MIS'];

export default function InvestScreen() {
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [orderType, setOrderType] = useState('BUY');
  const [productType, setProductType] = useState('CNC');
  const [placing, setPlacing] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [zerodhaConnected, setZerodhaConnected] = useState(false);

  useEffect(() => {
    fetchTransactions();
    checkZerodhaStatus();
  }, []);

  const checkZerodhaStatus = async () => {
    try {
      const user = auth.currentUser;
      const res = await fetch(`${BACKEND_URL}/zerodha/status?userId=${user?.uid}`);
      const data = await res.json();
      setZerodhaConnected(data.connected);
    } catch (e) {
      console.log('Zerodha status check failed:', e);
    }
  };

  const connectZerodha = () => {
    const user = auth.currentUser;
    Linking.openURL(`${BACKEND_URL}/zerodha/login?userId=${user?.uid}`);
  };

  const handleDisconnect = async () => {
    try {
      const user = auth.currentUser;
      await disconnectZerodha({ userId: user?.uid });
      setZerodhaConnected(false);
      Alert.alert('Disconnected', 'Successfully disconnected from Zerodha.');
    } catch (e) {
      Alert.alert('Error', 'Failed to disconnect. Please try again.');
    }
  };

  const fetchTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const data = await getPortfolio();
      setTransactions(data.investments || data.portfolio || data.transactions || (Array.isArray(data) ? data : []));
    } catch (error) {
      console.log('Error fetching portfolio:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!symbol.trim()) {
      Alert.alert('Error', 'Please enter a stock symbol.');
      return;
    }
    if (!quantity || isNaN(parseInt(quantity)) || parseInt(quantity) <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity.');
      return;
    }

    Alert.alert(
      'Confirm Order',
      `${orderType} ${quantity} shares of ${symbol.toUpperCase()} (${productType})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setPlacing(true);
            try {
              const response = await placeOrder({
                symbol: symbol.toUpperCase().trim(),
                quantity: parseInt(quantity),
                type: orderType,
                product: productType,
              });
              Alert.alert(
                'Order Placed!',
                response.message || `${orderType} order for ${quantity} shares of ${symbol.toUpperCase()} placed successfully.`
              );
              setSymbol('');
              setQuantity('');
              fetchTransactions();
            } catch (error) {
              Alert.alert('Order Failed', error.message || 'Failed to place order. Please try again.');
            } finally {
              setPlacing(false);
            }
          },
        },
      ]
    );
  };

  const renderTransaction = ({ item }) => {
    const isBuy = (item.type || item.transaction_type || '').toUpperCase() === 'BUY';
    return (
      <View style={styles.transactionCard}>
        <View style={styles.transactionLeft}>
          <Text style={styles.transactionSymbol}>
            {item.symbol || item.tradingsymbol || 'N/A'}
          </Text>
          <Text style={styles.transactionDetails}>
            {item.quantity || item.qty || 0} shares {'\u00B7'} {item.product || 'CNC'}
          </Text>
        </View>
        <View style={[styles.typeBadge, isBuy ? styles.buyBadge : styles.sellBadge]}>
          <Text style={[styles.typeBadgeText, isBuy ? styles.buyText : styles.sellText]}>
            {(item.type || item.transaction_type || 'BUY').toUpperCase()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Invest</Text>
          <Text style={styles.headerSubtitle}>Place stock orders</Text>
        </View>

        <View style={styles.zerodhaCard}>
          <View style={styles.zerodhaStatus}>
            <View style={[styles.statusDot, zerodhaConnected ? styles.dotGreen : styles.dotRed]} />
            <Text style={styles.zerodhaStatusText}>
              {zerodhaConnected ? 'Zerodha Connected — Live Trading' : 'Zerodha Not Connected — Simulation Mode'}
            </Text>
          </View>
          {!zerodhaConnected && (
            <TouchableOpacity style={styles.connectButton} onPress={connectZerodha}>
              <Text style={styles.connectButtonText}>Connect Zerodha</Text>
            </TouchableOpacity>
          )}
          {zerodhaConnected && (
            <View style={styles.zerodhaActions}>
              <TouchableOpacity style={styles.refreshStatusButton} onPress={checkZerodhaStatus}>
                <Text style={styles.refreshStatusText}>Refresh Status</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
                <Text style={styles.disconnectText}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>Stock Symbol</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., RELIANCE, TCS, INFY"
            placeholderTextColor="#999"
            autoCapitalize="characters"
            value={symbol}
            onChangeText={setSymbol}
          />

          <Text style={styles.fieldLabel}>Quantity</Text>
          <TextInput
            style={styles.input}
            placeholder="Number of shares"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={quantity}
            onChangeText={setQuantity}
          />

          <Text style={styles.fieldLabel}>Order Type</Text>
          <View style={styles.pickerRow}>
            {ORDER_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.pickerOption,
                  orderType === type && (type === 'BUY' ? styles.buyOption : styles.sellOption),
                ]}
                onPress={() => setOrderType(type)}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    orderType === type && styles.pickerOptionTextActive,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Product Type</Text>
          <View style={styles.pickerRow}>
            {PRODUCT_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.pickerOption,
                  productType === type && styles.activeProduct,
                ]}
                onPress={() => setProductType(type)}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    productType === type && styles.pickerOptionTextActive,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.productInfo}>
            <Text style={styles.productInfoText}>
              {productType === 'CNC'
                ? 'CNC: Cash and Carry (Delivery) - for long-term holding'
                : 'MIS: Margin Intraday Square-off - for intraday trading'}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.placeOrderButton,
              orderType === 'SELL' && styles.sellOrderButton,
              placing && { opacity: 0.7 },
            ]}
            onPress={handlePlaceOrder}
            disabled={placing}
          >
            {placing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.placeOrderButtonText}>
                Place {orderType} Order
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.transactionsSection}>
          <View style={styles.transactionsHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={fetchTransactions}>
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {loadingTransactions ? (
            <ActivityIndicator size="small" color="#FF6B00" style={{ marginTop: 20 }} />
          ) : Array.isArray(transactions) && transactions.length > 0 ? (
            transactions.slice(0, 10).map((item, index) => (
              <View key={item.id || index}>
                {renderTransaction({ item })}
              </View>
            ))
          ) : (
            <View style={styles.emptyTransactions}>
              <Text style={styles.emptyIcon}>{'📊'}</Text>
              <Text style={styles.emptyText}>No recent transactions.</Text>
              <Text style={styles.emptySubtext}>
                Place your first order to get started!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: '#1a1a2e',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#aaa',
    marginTop: 2,
  },
  formCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  buyOption: {
    backgroundColor: '#00C853',
    borderColor: '#00C853',
  },
  sellOption: {
    backgroundColor: '#FF1744',
    borderColor: '#FF1744',
  },
  activeProduct: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  pickerOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  pickerOptionTextActive: {
    color: '#fff',
  },
  productInfo: {
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  productInfoText: {
    fontSize: 12,
    color: '#F57F17',
    lineHeight: 18,
  },
  placeOrderButton: {
    backgroundColor: '#00C853',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sellOrderButton: {
    backgroundColor: '#FF1744',
    shadowColor: '#FF1744',
  },
  placeOrderButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  transactionsSection: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  refreshText: {
    color: '#FF6B00',
    fontWeight: '600',
    fontSize: 14,
  },
  transactionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionLeft: {
    flex: 1,
  },
  transactionSymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  transactionDetails: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  buyBadge: {
    backgroundColor: '#E8F5E9',
  },
  sellBadge: {
    backgroundColor: '#FFEBEE',
  },
  typeBadgeText: {
    fontWeight: '700',
    fontSize: 13,
  },
  buyText: {
    color: '#00C853',
  },
  sellText: {
    color: '#FF1744',
  },
  emptyTransactions: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  zerodhaCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  zerodhaStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  dotGreen: {
    backgroundColor: '#00C853',
  },
  dotRed: {
    backgroundColor: '#FF1744',
  },
  zerodhaStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
    flex: 1,
  },
  connectButton: {
    backgroundColor: '#FF6B00',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  refreshStatusButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  refreshStatusText: {
    color: '#FF6B00',
    fontWeight: '600',
    fontSize: 14,
  },
  zerodhaActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  disconnectButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  disconnectText: {
    color: '#FF1744',
    fontWeight: '600',
    fontSize: 14,
  },
});
