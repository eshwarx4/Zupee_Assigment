import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/api_service.dart';

class InvestScreen extends StatefulWidget {
  const InvestScreen({super.key});

  @override
  State<InvestScreen> createState() => _InvestScreenState();
}

class _InvestScreenState extends State<InvestScreen> {
  final _symbolController = TextEditingController();
  final _quantityController = TextEditingController();

  bool _isBuy = true; // true = BUY, false = SELL
  bool _isCNC = true; // true = CNC, false = MIS
  bool _isConnected = false;
  bool _checkingStatus = true;
  bool _placingOrder = false;

  List<dynamic> _transactions = [];
  bool _loadingPortfolio = false;

  @override
  void initState() {
    super.initState();
    _checkZerodhaStatus();
    _loadPortfolio();
  }

  @override
  void dispose() {
    _symbolController.dispose();
    _quantityController.dispose();
    super.dispose();
  }

  Future<void> _checkZerodhaStatus() async {
    setState(() => _checkingStatus = true);
    try {
      final status = await ApiService.getZerodhaStatus();
      if (mounted) {
        setState(() {
          _isConnected = status['connected'] == true;
          _checkingStatus = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _isConnected = false;
          _checkingStatus = false;
        });
      }
    }
  }

  Future<void> _loadPortfolio() async {
    setState(() => _loadingPortfolio = true);
    try {
      final data = await ApiService.getPortfolio();
      if (mounted) {
        setState(() {
          _transactions = data['holdings'] ??
              data['positions'] ??
              data['transactions'] ??
              data['orders'] ??
              [];
          _loadingPortfolio = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _loadingPortfolio = false);
      }
    }
  }

  Future<void> _placeOrder() async {
    final symbol = _symbolController.text.trim().toUpperCase();
    final quantity = int.tryParse(_quantityController.text.trim()) ?? 0;

    if (symbol.isEmpty) {
      _showSnackBar('Please enter a stock symbol');
      return;
    }
    if (quantity <= 0) {
      _showSnackBar('Please enter a valid quantity');
      return;
    }

    final type = _isBuy ? 'BUY' : 'SELL';
    final product = _isCNC ? 'CNC' : 'MIS';

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirm Order'),
        content: Text(
          '$type $quantity shares of $symbol ($product)\n\nAre you sure?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor:
                  _isBuy ? const Color(0xFF00C853) : const Color(0xFFFF1744),
            ),
            child: Text(type),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _placingOrder = true);
    try {
      final result = await ApiService.placeOrder(
        symbol: symbol,
        quantity: quantity,
        type: type,
        product: product,
      );
      if (mounted) {
        _showSnackBar(
          result['message'] ?? 'Order placed successfully!',
          isError: false,
        );
        _symbolController.clear();
        _quantityController.clear();
        _loadPortfolio();
      }
    } catch (e) {
      if (mounted) {
        _showSnackBar('Order failed: $e');
      }
    } finally {
      if (mounted) {
        setState(() => _placingOrder = false);
      }
    }
  }

  void _showZerodhaUrl() {
    final url = ApiService.getZerodhaLoginUrl();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Connect Zerodha'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Open this URL in a browser to connect your Zerodha account:'),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(8),
              ),
              child: SelectableText(
                url,
                style: const TextStyle(
                  fontSize: 13,
                  color: Color(0xFF1a1a2e),
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Clipboard.setData(ClipboardData(text: url));
              Navigator.pop(ctx);
              _showSnackBar('URL copied to clipboard', isError: false);
            },
            child: const Text('Copy URL'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  void _showSnackBar(String message, {bool isError = true}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor:
            isError ? const Color(0xFFFF1744) : const Color(0xFF00C853),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        title: const Text('Invest'),
        backgroundColor: const Color(0xFF1a1a2e),
      ),
      body: RefreshIndicator(
        color: const Color(0xFFFF6B00),
        onRefresh: () async {
          await Future.wait([_checkZerodhaStatus(), _loadPortfolio()]);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Zerodha connection card
              _buildZerodhaCard(),
              const SizedBox(height: 20),

              // Order form
              _buildOrderForm(),
              const SizedBox(height: 20),

              // Recent transactions
              _buildTransactionsList(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildZerodhaCard() {
    return Container(
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
      child: Row(
        children: [
          // Status dot
          Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: _checkingStatus
                  ? Colors.grey
                  : _isConnected
                      ? const Color(0xFF00C853)
                      : const Color(0xFFFF1744),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Zerodha',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF1a1a2e),
                  ),
                ),
                Text(
                  _checkingStatus
                      ? 'Checking...'
                      : _isConnected
                          ? 'Connected'
                          : 'Not Connected',
                  style: TextStyle(
                    fontSize: 13,
                    color: _checkingStatus
                        ? Colors.grey
                        : _isConnected
                            ? const Color(0xFF00C853)
                            : const Color(0xFFFF1744),
                  ),
                ),
              ],
            ),
          ),
          if (!_isConnected && !_checkingStatus)
            ElevatedButton(
              onPressed: _showZerodhaUrl,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFF6B00),
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              ),
              child: const Text('Connect'),
            ),
          if (_isConnected && !_checkingStatus)
            TextButton(
              onPressed: () async {
                try {
                  await ApiService.disconnectZerodha();
                  _checkZerodhaStatus();
                } catch (e) {
                  _showSnackBar('Failed to disconnect');
                }
              },
              child: const Text(
                'Disconnect',
                style: TextStyle(color: Color(0xFFFF1744)),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildOrderForm() {
    return Container(
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
          const Text(
            'Place Order',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1a1a2e),
            ),
          ),
          const SizedBox(height: 16),

          // Symbol
          TextField(
            controller: _symbolController,
            textCapitalization: TextCapitalization.characters,
            style: const TextStyle(color: Colors.black87),
            decoration: InputDecoration(
              labelText: 'Stock Symbol (e.g. RELIANCE)',
              labelStyle: TextStyle(color: Colors.grey.shade600),
              filled: true,
              fillColor: Colors.grey.shade100,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: Colors.grey.shade300),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: Colors.grey.shade300),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide:
                    const BorderSide(color: Color(0xFFFF6B00), width: 2),
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Quantity
          TextField(
            controller: _quantityController,
            keyboardType: TextInputType.number,
            style: const TextStyle(color: Colors.black87),
            decoration: InputDecoration(
              labelText: 'Quantity',
              labelStyle: TextStyle(color: Colors.grey.shade600),
              filled: true,
              fillColor: Colors.grey.shade100,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: Colors.grey.shade300),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: Colors.grey.shade300),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide:
                    const BorderSide(color: Color(0xFFFF6B00), width: 2),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // BUY / SELL toggle
          Row(
            children: [
              const Text('Type: ',
                  style: TextStyle(
                      color: Color(0xFF1a1a2e), fontWeight: FontWeight.w500)),
              const SizedBox(width: 8),
              _buildToggleChip('BUY', _isBuy, const Color(0xFF00C853), () {
                setState(() => _isBuy = true);
              }),
              const SizedBox(width: 8),
              _buildToggleChip('SELL', !_isBuy, const Color(0xFFFF1744), () {
                setState(() => _isBuy = false);
              }),
              const SizedBox(width: 24),
              const Text('Product: ',
                  style: TextStyle(
                      color: Color(0xFF1a1a2e), fontWeight: FontWeight.w500)),
              const SizedBox(width: 8),
              _buildToggleChip('CNC', _isCNC, const Color(0xFFFF6B00), () {
                setState(() => _isCNC = true);
              }),
              const SizedBox(width: 8),
              _buildToggleChip('MIS', !_isCNC, const Color(0xFFFF6B00), () {
                setState(() => _isCNC = false);
              }),
            ],
          ),
          const SizedBox(height: 20),

          // Place Order button
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: _placingOrder ? null : _placeOrder,
              style: ElevatedButton.styleFrom(
                backgroundColor: _isBuy
                    ? const Color(0xFF00C853)
                    : const Color(0xFFFF1744),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: _placingOrder
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2.5,
                      ),
                    )
                  : Text(
                      _isBuy ? 'Place BUY Order' : 'Place SELL Order',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildToggleChip(
      String label, bool isSelected, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? color : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? color : Colors.grey.shade400,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.grey.shade600,
            fontWeight: FontWeight.w600,
            fontSize: 13,
          ),
        ),
      ),
    );
  }

  Widget _buildTransactionsList() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Recent Transactions',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1a1a2e),
          ),
        ),
        const SizedBox(height: 12),
        if (_loadingPortfolio)
          const Center(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: CircularProgressIndicator(color: Color(0xFFFF6B00)),
            ),
          )
        else if (_transactions.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                Icon(Icons.receipt_long, size: 40, color: Colors.grey.shade400),
                const SizedBox(height: 8),
                Text(
                  'No transactions yet',
                  style: TextStyle(color: Colors.grey.shade600),
                ),
              ],
            ),
          )
        else
          ..._transactions.map((txn) {
            final data = txn is Map<String, dynamic> ? txn : <String, dynamic>{};
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          data['tradingsymbol'] ??
                              data['symbol'] ??
                              'Unknown',
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF1a1a2e),
                          ),
                        ),
                        Text(
                          'Qty: ${data['quantity'] ?? '-'}  |  ${data['product'] ?? ''}',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    data['transaction_type'] ?? data['type'] ?? '',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: (data['transaction_type'] ?? data['type'] ?? '') ==
                              'BUY'
                          ? const Color(0xFF00C853)
                          : const Color(0xFFFF1744),
                    ),
                  ),
                ],
              ),
            );
          }),
      ],
    );
  }
}
