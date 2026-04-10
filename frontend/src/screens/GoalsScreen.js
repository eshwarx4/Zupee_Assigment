import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const CATEGORIES = ['Equity', 'Debt', 'Gold', 'Real Estate', 'FD', 'PPF'];

export default function GoalsScreen() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState('Equity');

  const user = auth.currentUser;

  const fetchGoals = useCallback(async () => {
    try {
      const q = query(
        collection(db, 'goals'),
        where('userId', '==', user?.uid)
      );
      const snapshot = await getDocs(q);
      const goalsData = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
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

  const resetForm = () => {
    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setDeadline('');
    setCategory('Equity');
    setEditingGoal(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (goal) => {
    setEditingGoal(goal);
    setName(goal.name || '');
    setTargetAmount(String(goal.targetAmount || ''));
    setCurrentAmount(String(goal.currentAmount || ''));
    setDeadline(goal.deadline || '');
    setCategory(goal.category || 'Equity');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a goal name.');
      return;
    }
    if (!targetAmount || isNaN(parseFloat(targetAmount))) {
      Alert.alert('Error', 'Please enter a valid target amount.');
      return;
    }

    setSaving(true);
    try {
      const goalData = {
        name: name.trim(),
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount) || 0,
        deadline: deadline.trim(),
        category,
        userId: user?.uid,
        updatedAt: new Date().toISOString(),
      };

      if (editingGoal) {
        const goalRef = doc(db, 'goals', editingGoal.id);
        await updateDoc(goalRef, goalData);
        Alert.alert('Success', 'Goal updated successfully!');
      } else {
        goalData.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'goals'), goalData);
        Alert.alert('Success', 'Goal created successfully!');
      }

      setModalVisible(false);
      resetForm();
      fetchGoals();
    } catch (error) {
      Alert.alert('Error', 'Failed to save goal. Please try again.');
      console.log('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (goal) => {
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete "${goal.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'goals', goal.id));
              fetchGoals();
              Alert.alert('Deleted', 'Goal has been removed.');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete goal.');
            }
          },
        },
      ]
    );
  };

  const renderGoalItem = ({ item }) => {
    const progress = item.targetAmount
      ? (item.currentAmount / item.targetAmount) * 100
      : 0;
    const clampedProgress = Math.min(progress, 100);

    return (
      <View style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.goalName}>{item.name}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{item.category || 'General'}</Text>
            </View>
          </View>
          <View style={styles.goalActions}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => openEditModal(item)}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(item)}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.amountRow}>
          <View>
            <Text style={styles.amountLabel}>Current</Text>
            <Text style={styles.amountValue}>
              {'\u20B9'}{Number(item.currentAmount || 0).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.amountDivider} />
          <View>
            <Text style={styles.amountLabel}>Target</Text>
            <Text style={[styles.amountValue, { color: '#00C853' }]}>
              {'\u20B9'}{Number(item.targetAmount || 0).toLocaleString('en-IN')}
            </Text>
          </View>
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
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>{clampedProgress.toFixed(1)}%</Text>
          {item.deadline ? (
            <Text style={styles.deadlineText}>Due: {item.deadline}</Text>
          ) : null}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Goals</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ Add Goal</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={goals}
        keyExtractor={(item) => item.id}
        renderItem={renderGoalItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>{'🎯'}</Text>
            <Text style={styles.emptyText}>No goals created yet.</Text>
            <Text style={styles.emptySubtext}>
              Tap "Add Goal" to set your first investment target.
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchGoals();
            }}
            tintColor="#FF6B00"
            colors={['#FF6B00']}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setModalVisible(false);
          resetForm();
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {editingGoal ? 'Edit Goal' : 'Create New Goal'}
              </Text>

              <Text style={styles.fieldLabel}>Goal Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., Emergency Fund"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.fieldLabel}>Target Amount ({'\u20B9'})</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., 500000"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={targetAmount}
                onChangeText={setTargetAmount}
              />

              <Text style={styles.fieldLabel}>Current Amount ({'\u20B9'})</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., 100000"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={currentAmount}
                onChangeText={setCurrentAmount}
              />

              <Text style={styles.fieldLabel}>Deadline (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., 2027-12-31"
                placeholderTextColor="#999"
                value={deadline}
                onChangeText={setDeadline}
              />

              <Text style={styles.fieldLabel}>Category</Text>
              <View style={styles.categoryRow}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      category === cat && styles.categoryChipActive,
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        category === cat && styles.categoryChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setModalVisible(false);
                    resetForm();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, saving && { opacity: 0.7 }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      {editingGoal ? 'Update' : 'Create'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1a1a2e',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  goalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  goalName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 6,
  },
  categoryBadge: {
    backgroundColor: '#FF6B0015',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  categoryBadgeText: {
    color: '#FF6B00',
    fontSize: 12,
    fontWeight: '600',
  },
  goalActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  editButton: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#1976D2',
    fontWeight: '600',
    fontSize: 13,
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#FF1744',
    fontWeight: '600',
    fontSize: 13,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  amountDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#eee',
    marginHorizontal: 20,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#eee',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: 13,
    color: '#FF6B00',
    fontWeight: '600',
  },
  deadlineText: {
    fontSize: 12,
    color: '#aaa',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 20,
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
    marginTop: 8,
  },
  modalInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryChipActive: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  categoryChipText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FF6B00',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
