import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export default function DashboardScreen({ navigation }) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const user = auth.currentUser;

  const fetchGoals = useCallback(async () => {
    try {
      const q = query(
        collection(db, 'goals'),
        where('userId', '==', user?.uid)
      );
      const snapshot = await getDocs(q);
      const goalsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGoals(goalsData);
    } catch (error) {
      console.log('Error fetching goals:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchGoals();
    });
    return unsubscribe;
  }, [navigation, fetchGoals]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchGoals();
  };

  const totalInvestment = goals.reduce(
    (sum, goal) => sum + (parseFloat(goal.currentAmount) || 0),
    0
  );
  const totalTarget = goals.reduce(
    (sum, goal) => sum + (parseFloat(goal.targetAmount) || 0),
    0
  );

  const quickActions = [
    { title: 'AI Advisor', icon: '🤖', screen: 'AI Chat', color: '#6C63FF' },
    { title: 'Invest Now', icon: '📈', screen: 'Invest', color: '#00C853' },
    { title: 'My Goals', icon: '🎯', screen: 'Goals', color: '#FF6B00' },
  ];

  const renderGoalCard = ({ item }) => {
    const progress = item.targetAmount
      ? (item.currentAmount / item.targetAmount) * 100
      : 0;
    const clampedProgress = Math.min(progress, 100);

    return (
      <View style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <Text style={styles.goalName}>{item.name}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category || 'General'}</Text>
          </View>
        </View>
        <View style={styles.goalAmounts}>
          <Text style={styles.goalCurrentAmount}>
            {'\u20B9'}{Number(item.currentAmount || 0).toLocaleString('en-IN')}
          </Text>
          <Text style={styles.goalTargetAmount}>
            / {'\u20B9'}{Number(item.targetAmount || 0).toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${clampedProgress}%`,
                backgroundColor: clampedProgress >= 100 ? '#00C853' : '#FF6B00',
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{clampedProgress.toFixed(1)}% achieved</Text>
        {item.deadline && (
          <Text style={styles.deadlineText}>Deadline: {item.deadline}</Text>
        )}
      </View>
    );
  };

  const ListHeader = () => (
    <View>
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeText}>Namaste! {'\u{1F64F}'}</Text>
        <Text style={styles.emailText}>{user?.email}</Text>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Invested</Text>
          <Text style={styles.summaryAmount}>
            {'\u20B9'}{totalInvestment.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Target</Text>
          <Text style={[styles.summaryAmount, { color: '#00C853' }]}>
            {'\u20B9'}{totalTarget.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.quickActionButton, { backgroundColor: action.color + '20' }]}
              onPress={() => navigation.navigate(action.screen)}
            >
              <Text style={styles.quickActionIcon}>{action.icon}</Text>
              <Text style={[styles.quickActionText, { color: action.color }]}>
                {action.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text style={styles.sectionTitle}>
        Your Goals ({goals.length})
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={goals}
        keyExtractor={(item) => item.id}
        renderItem={renderGoalCard}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>{'🎯'}</Text>
            <Text style={styles.emptyText}>No goals yet!</Text>
            <Text style={styles.emptySubtext}>
              Start by creating your first investment goal.
            </Text>
            <TouchableOpacity
              style={styles.createGoalButton}
              onPress={() => navigation.navigate('Goals')}
            >
              <Text style={styles.createGoalButtonText}>Create Goal</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF6B00"
            colors={['#FF6B00']}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  welcomeContainer: {
    backgroundColor: '#1a1a2e',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    color: '#aaa',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: -1,
    gap: 12,
    paddingTop: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#888',
    marginBottom: 4,
    fontWeight: '500',
  },
  summaryAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  quickActionsContainer: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  goalCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: '#FF6B0015',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    color: '#FF6B00',
    fontSize: 12,
    fontWeight: '600',
  },
  goalAmounts: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  goalCurrentAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  goalTargetAmount: {
    fontSize: 14,
    color: '#888',
    marginLeft: 4,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  deadlineText: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  createGoalButton: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createGoalButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
