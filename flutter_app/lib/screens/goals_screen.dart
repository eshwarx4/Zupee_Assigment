import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';

class GoalsScreen extends StatefulWidget {
  const GoalsScreen({super.key});

  @override
  State<GoalsScreen> createState() => _GoalsScreenState();
}

class _GoalsScreenState extends State<GoalsScreen> {
  final _firestore = FirebaseFirestore.instance;
  final _currencyFormat =
      NumberFormat.currency(locale: 'en_IN', symbol: '\u20B9', decimalDigits: 0);

  String get _userId => FirebaseAuth.instance.currentUser?.uid ?? '';

  static const List<String> _categories = [
    'Equity',
    'Debt',
    'Gold',
    'Real Estate',
    'FD',
    'PPF',
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        title: const Text('My Goals'),
        backgroundColor: const Color(0xFF1a1a2e),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _showGoalDialog(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showGoalDialog(),
        backgroundColor: const Color(0xFFFF6B00),
        child: const Icon(Icons.add),
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: _firestore
            .collection('goals')
            .where('userId', isEqualTo: _userId)
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: CircularProgressIndicator(color: Color(0xFFFF6B00)),
            );
          }

          final goals = snapshot.data?.docs ?? [];

          if (goals.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.flag_outlined,
                      size: 64, color: Colors.grey.shade400),
                  const SizedBox(height: 16),
                  Text(
                    'No goals yet',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: Colors.grey.shade600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Tap + to create your first investment goal',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey.shade500,
                    ),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: goals.length,
            itemBuilder: (context, index) {
              final doc = goals[index];
              final data = doc.data() as Map<String, dynamic>;
              return _buildGoalCard(doc.id, data);
            },
          );
        },
      ),
    );
  }

  Widget _buildGoalCard(String docId, Map<String, dynamic> data) {
    final name = data['name'] ?? 'Goal';
    final category = data['category'] ?? '';
    final current = (data['currentAmount'] as num?)?.toDouble() ?? 0;
    final target = (data['targetAmount'] as num?)?.toDouble() ?? 1;
    final progress = (current / target).clamp(0.0, 1.0);
    final deadline = data['deadline'] as String?;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  name,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF1a1a2e),
                  ),
                ),
              ),
              if (category.isNotEmpty)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFF6B00).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    category,
                    style: const TextStyle(
                      fontSize: 11,
                      color: Color(0xFFFF6B00),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              const SizedBox(width: 8),
              IconButton(
                icon: const Icon(Icons.edit, size: 20),
                color: Colors.grey.shade600,
                onPressed: () =>
                    _showGoalDialog(docId: docId, existingData: data),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
              const SizedBox(width: 12),
              IconButton(
                icon: const Icon(Icons.delete, size: 20),
                color: const Color(0xFFFF1744),
                onPressed: () => _confirmDelete(docId, name),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 8,
              backgroundColor: Colors.grey.shade200,
              valueColor: AlwaysStoppedAnimation<Color>(
                progress >= 1.0
                    ? const Color(0xFF00C853)
                    : const Color(0xFFFF6B00),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                _currencyFormat.format(current),
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF1a1a2e),
                ),
              ),
              Text(
                '${(progress * 100).toStringAsFixed(1)}%',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey.shade600,
                  fontWeight: FontWeight.w500,
                ),
              ),
              Text(
                _currencyFormat.format(target),
                style: TextStyle(
                  fontSize: 13,
                  color: Colors.grey.shade600,
                ),
              ),
            ],
          ),
          if (deadline != null && deadline.isNotEmpty) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.calendar_today,
                    size: 14, color: Colors.grey.shade500),
                const SizedBox(width: 4),
                Text(
                  'Deadline: $deadline',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey.shade500,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _confirmDelete(String docId, String name) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Goal'),
        content: Text('Are you sure you want to delete "$name"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: const Color(0xFFFF1744)),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await _firestore.collection('goals').doc(docId).delete();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Goal deleted')),
        );
      }
    }
  }

  Future<void> _showGoalDialog({
    String? docId,
    Map<String, dynamic>? existingData,
  }) async {
    final isEdit = docId != null;
    final nameController =
        TextEditingController(text: existingData?['name'] ?? '');
    final targetController = TextEditingController(
        text: existingData?['targetAmount']?.toString() ?? '');
    final currentController = TextEditingController(
        text: existingData?['currentAmount']?.toString() ?? '0');
    String selectedCategory = existingData?['category'] ?? _categories.first;
    String? selectedDeadline = existingData?['deadline'];

    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: Text(isEdit ? 'Edit Goal' : 'Add Goal'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nameController,
                  decoration: const InputDecoration(
                    labelText: 'Goal Name',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: targetController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Target Amount (\u20B9)',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: currentController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Current Amount (\u20B9)',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: selectedCategory,
                  decoration: const InputDecoration(
                    labelText: 'Category',
                    border: OutlineInputBorder(),
                  ),
                  items: _categories
                      .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                      .toList(),
                  onChanged: (val) {
                    if (val != null) {
                      setDialogState(() => selectedCategory = val);
                    }
                  },
                ),
                const SizedBox(height: 12),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(
                    selectedDeadline ?? 'Select Deadline',
                    style: TextStyle(
                      color: selectedDeadline != null
                          ? Colors.black87
                          : Colors.grey,
                    ),
                  ),
                  trailing: const Icon(Icons.calendar_today),
                  onTap: () async {
                    final picked = await showDatePicker(
                      context: ctx,
                      initialDate: DateTime.now().add(const Duration(days: 365)),
                      firstDate: DateTime.now(),
                      lastDate: DateTime(2050),
                    );
                    if (picked != null) {
                      setDialogState(() {
                        selectedDeadline =
                            DateFormat('yyyy-MM-dd').format(picked);
                      });
                    }
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                final name = nameController.text.trim();
                final target =
                    double.tryParse(targetController.text.trim()) ?? 0;
                final current =
                    double.tryParse(currentController.text.trim()) ?? 0;

                if (name.isEmpty || target <= 0) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                        content:
                            Text('Please enter a name and valid target amount')),
                  );
                  return;
                }

                final goalData = {
                  'name': name,
                  'targetAmount': target,
                  'currentAmount': current,
                  'category': selectedCategory,
                  'deadline': selectedDeadline ?? '',
                  'userId': _userId,
                  'updatedAt': FieldValue.serverTimestamp(),
                };

                if (isEdit) {
                  await _firestore
                      .collection('goals')
                      .doc(docId)
                      .update(goalData);
                } else {
                  goalData['createdAt'] = FieldValue.serverTimestamp();
                  await _firestore.collection('goals').add(goalData);
                }

                if (ctx.mounted) Navigator.pop(ctx);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFF6B00),
              ),
              child: Text(isEdit ? 'Update' : 'Add'),
            ),
          ],
        ),
      ),
    );

    nameController.dispose();
    targetController.dispose();
    currentController.dispose();
  }
}
