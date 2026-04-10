import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../services/api_service.dart';

class _Asset {
  final String name;
  final String symbol;
  const _Asset(this.name, this.symbol);
}

class _Category {
  final String id;
  final String label;
  final List<_Asset> assets;
  const _Category(this.id, this.label, this.assets);
}

final List<_Category> _categories = [
  const _Category('indices', 'Indices', [
    _Asset('NIFTY 50', 'NSE:NIFTY'),
    _Asset('SENSEX', 'BSE:SENSEX'),
    _Asset('BANK NIFTY', 'NSE:BANKNIFTY'),
    _Asset('NIFTY IT', 'NSE:CNXIT'),
  ]),
  const _Category('stocks', 'Stocks', [
    _Asset('RELIANCE', 'NSE:RELIANCE'),
    _Asset('TCS', 'NSE:TCS'),
    _Asset('INFOSYS', 'NSE:INFY'),
    _Asset('HDFC BANK', 'NSE:HDFCBANK'),
    _Asset('ICICI BANK', 'NSE:ICICIBANK'),
    _Asset('ITC', 'NSE:ITC'),
    _Asset('SBI', 'NSE:SBIN'),
    _Asset('TATA MOTORS', 'NSE:TATAMOTORS'),
    _Asset('WIPRO', 'NSE:WIPRO'),
    _Asset('BHARTI AIRTEL', 'NSE:BHARTIARTL'),
  ]),
  const _Category('commodities', 'Gold & Silver', [
    _Asset('GOLD', 'MCX:GOLD1!'),
    _Asset('SILVER', 'MCX:SILVER1!'),
    _Asset('CRUDE OIL', 'MCX:CRUDEOIL1!'),
  ]),
  const _Category('etfs', 'ETFs', [
    _Asset('NIFTYBEES', 'NSE:NIFTYBEES'),
    _Asset('GOLDBEES', 'NSE:GOLDBEES'),
    _Asset('BANKBEES', 'NSE:BANKBEES'),
    _Asset('SILVERBEES', 'NSE:SILVERBEES'),
  ]),
];

const List<Map<String, String>> _intervals = [
  {'label': '1m', 'value': '1'},
  {'label': '5m', 'value': '5'},
  {'label': '15m', 'value': '15'},
  {'label': '1H', 'value': '60'},
  {'label': '1D', 'value': 'D'},
  {'label': '1W', 'value': 'W'},
];

class ChartScreen extends StatefulWidget {
  const ChartScreen({super.key});

  @override
  State<ChartScreen> createState() => _ChartScreenState();
}

class _ChartScreenState extends State<ChartScreen> {
  int _selectedCategoryIndex = 0;
  int _selectedAssetIndex = 0;
  int _selectedIntervalIndex = 3; // Default 1H
  bool _loadingChart = false;
  bool _loadingAI = false;
  String? _aiRecommendation;
  List<Map<String, dynamic>> _candles = [];
  double? _currentPrice;
  double? _previousClose;

  @override
  void initState() {
    super.initState();
    _fetchChartData();
  }

  _Asset get _selectedAsset =>
      _categories[_selectedCategoryIndex].assets[_selectedAssetIndex];

  String get _selectedInterval =>
      _intervals[_selectedIntervalIndex]['value']!;

  Future<void> _fetchChartData() async {
    setState(() => _loadingChart = true);

    final symbol = _selectedAsset.symbol;
    final parts = symbol.split(':');
    final exchange = parts.length == 2 ? parts[0] : 'NSE';
    final sym = parts.length == 2 ? parts[1] : symbol;

    // Map interval to Yahoo Finance format
    String yahooInterval;
    String range;
    switch (_selectedInterval) {
      case '1':
        yahooInterval = '1m';
        range = '1d';
        break;
      case '5':
        yahooInterval = '5m';
        range = '5d';
        break;
      case '15':
        yahooInterval = '15m';
        range = '5d';
        break;
      case '60':
        yahooInterval = '1h';
        range = '1mo';
        break;
      case 'D':
        yahooInterval = '1d';
        range = '6mo';
        break;
      case 'W':
        yahooInterval = '1wk';
        range = '2y';
        break;
      default:
        yahooInterval = '1h';
        range = '1mo';
    }

    try {
      final url = Uri.parse(
        '${ApiService.baseUrl}/chart-data?symbol=${Uri.encodeComponent(sym)}&exchange=${Uri.encodeComponent(exchange)}&interval=$yahooInterval&range=$range',
      );
      final response = await http.get(url);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final candles = (data['candles'] as List?)
                ?.map((c) => Map<String, dynamic>.from(c))
                .toList() ??
            [];

        if (mounted) {
          setState(() {
            _candles = candles;
            _currentPrice = (data['regularMarketPrice'] as num?)?.toDouble();
            _previousClose = (data['previousClose'] as num?)?.toDouble();
            _loadingChart = false;
          });
        }
      } else {
        if (mounted) setState(() => _loadingChart = false);
      }
    } catch (e) {
      if (mounted) setState(() => _loadingChart = false);
    }
  }

  Future<void> _fetchAIRecommendation() async {
    setState(() {
      _loadingAI = true;
      _aiRecommendation = null;
    });

    try {
      final message =
          'Give a 2-line investment insight for ${_selectedAsset.name} in Indian market context. Be specific and actionable.';
      final response = await ApiService.chatWithAI(message);
      if (mounted) {
        setState(() {
          _aiRecommendation = response;
          _loadingAI = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _aiRecommendation = 'Failed to get recommendation.';
          _loadingAI = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        title: const Text('Charts'),
        backgroundColor: const Color(0xFF1a1a2e),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Category chips
            _buildCategoryChips(),
            const SizedBox(height: 12),

            // Asset chips
            _buildAssetChips(),
            const SizedBox(height: 12),

            // Interval chips
            _buildIntervalChips(),
            const SizedBox(height: 16),

            // Price header
            _buildPriceHeader(),
            const SizedBox(height: 12),

            // Chart area
            _buildChartArea(),
            const SizedBox(height: 16),

            // AI recommendation
            _buildAISection(),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryChips() {
    return SizedBox(
      height: 40,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: _categories.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final isSelected = _selectedCategoryIndex == index;
          return GestureDetector(
            onTap: () {
              setState(() {
                _selectedCategoryIndex = index;
                _selectedAssetIndex = 0;
                _aiRecommendation = null;
              });
              _fetchChartData();
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: isSelected ? const Color(0xFFFF6B00) : Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isSelected ? const Color(0xFFFF6B00) : Colors.grey.shade300,
                ),
              ),
              child: Text(
                _categories[index].label,
                style: TextStyle(
                  color: isSelected ? Colors.white : Colors.grey.shade700,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildAssetChips() {
    final assets = _categories[_selectedCategoryIndex].assets;
    return SizedBox(
      height: 36,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: assets.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final isSelected = _selectedAssetIndex == index;
          return GestureDetector(
            onTap: () {
              setState(() {
                _selectedAssetIndex = index;
                _aiRecommendation = null;
              });
              _fetchChartData();
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              decoration: BoxDecoration(
                color: isSelected ? const Color(0xFF1a1a2e) : Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: isSelected ? const Color(0xFF1a1a2e) : Colors.grey.shade300,
                ),
              ),
              child: Text(
                assets[index].name,
                style: TextStyle(
                  color: isSelected ? Colors.white : Colors.grey.shade700,
                  fontWeight: FontWeight.w500,
                  fontSize: 12,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildIntervalChips() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: List.generate(_intervals.length, (index) {
        final isSelected = _selectedIntervalIndex == index;
        return GestureDetector(
          onTap: () {
            setState(() => _selectedIntervalIndex = index);
            _fetchChartData();
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: isSelected ? const Color(0xFFFF6B00) : Colors.transparent,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              _intervals[index]['label']!,
              style: TextStyle(
                color: isSelected ? Colors.white : Colors.grey.shade600,
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
            ),
          ),
        );
      }),
    );
  }

  Widget _buildPriceHeader() {
    if (_currentPrice == null) return const SizedBox.shrink();

    final change = _previousClose != null ? _currentPrice! - _previousClose! : 0.0;
    final changePercent = _previousClose != null && _previousClose! > 0
        ? (change / _previousClose!) * 100
        : 0.0;
    final isPositive = change >= 0;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _selectedAsset.name,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF1a1a2e),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '₹${_currentPrice!.toStringAsFixed(2)}',
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1a1a2e),
                ),
              ),
            ],
          ),
          const Spacer(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: isPositive
                  ? const Color(0xFF00C853).withValues(alpha: 0.1)
                  : const Color(0xFFFF1744).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(
                  isPositive ? Icons.arrow_upward : Icons.arrow_downward,
                  size: 16,
                  color: isPositive
                      ? const Color(0xFF00C853)
                      : const Color(0xFFFF1744),
                ),
                const SizedBox(width: 4),
                Text(
                  '${isPositive ? '+' : ''}${changePercent.toStringAsFixed(2)}%',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: isPositive
                        ? const Color(0xFF00C853)
                        : const Color(0xFFFF1744),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChartArea() {
    if (_loadingChart) {
      return Container(
        height: 300,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Center(
          child: CircularProgressIndicator(color: Color(0xFFFF6B00)),
        ),
      );
    }

    if (_candles.isEmpty) {
      return Container(
        height: 300,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Center(
          child: Text(
            'No chart data available',
            style: TextStyle(color: Colors.grey.shade500),
          ),
        ),
      );
    }

    return Container(
      height: 300,
      decoration: BoxDecoration(
        color: const Color(0xFF1a1a2e),
        borderRadius: BorderRadius.circular(16),
      ),
      padding: const EdgeInsets.all(12),
      child: CustomPaint(
        size: const Size(double.infinity, 276),
        painter: _CandlestickPainter(_candles),
      ),
    );
  }

  Widget _buildAISection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.auto_awesome, color: Color(0xFFFF6B00), size: 20),
              const SizedBox(width: 8),
              const Text(
                'AI Insight',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF1a1a2e),
                ),
              ),
              const Spacer(),
              TextButton(
                onPressed: _loadingAI ? null : _fetchAIRecommendation,
                child: Text(
                  _aiRecommendation == null ? 'Get Insight' : 'Refresh',
                  style: const TextStyle(color: Color(0xFFFF6B00)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (_loadingAI)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: CircularProgressIndicator(color: Color(0xFFFF6B00)),
              ),
            )
          else if (_aiRecommendation != null)
            Text(
              _aiRecommendation!,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade700,
                height: 1.5,
              ),
            )
          else
            Text(
              'Tap "Get Insight" for AI-powered analysis of ${_selectedAsset.name}',
              style: TextStyle(
                fontSize: 13,
                color: Colors.grey.shade500,
              ),
            ),
        ],
      ),
    );
  }
}

// Simple candlestick chart painter
class _CandlestickPainter extends CustomPainter {
  final List<Map<String, dynamic>> candles;

  _CandlestickPainter(this.candles);

  @override
  void paint(Canvas canvas, Size size) {
    if (candles.isEmpty) return;

    // Find min/max for scaling
    double minLow = double.infinity;
    double maxHigh = -double.infinity;
    for (final c in candles) {
      final low = (c['low'] as num?)?.toDouble() ?? 0;
      final high = (c['high'] as num?)?.toDouble() ?? 0;
      if (low < minLow) minLow = low;
      if (high > maxHigh) maxHigh = high;
    }

    if (maxHigh == minLow) {
      maxHigh = minLow + 1;
    }

    final range = maxHigh - minLow;
    final padding = range * 0.05;
    final adjustedMin = minLow - padding;
    final adjustedMax = maxHigh + padding;
    final adjustedRange = adjustedMax - adjustedMin;

    final candleWidth = (size.width / candles.length).clamp(1.0, 12.0);
    final gap = candleWidth * 0.2;

    // Draw grid lines
    final gridPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.08)
      ..strokeWidth = 0.5;

    for (int i = 0; i <= 4; i++) {
      final y = size.height * i / 4;
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }

    // Draw candles
    for (int i = 0; i < candles.length; i++) {
      final c = candles[i];
      final open = (c['open'] as num?)?.toDouble() ?? 0;
      final close = (c['close'] as num?)?.toDouble() ?? 0;
      final high = (c['high'] as num?)?.toDouble() ?? 0;
      final low = (c['low'] as num?)?.toDouble() ?? 0;

      final isGreen = close >= open;
      final color = isGreen ? const Color(0xFF00C853) : const Color(0xFFFF1744);

      final x = i * candleWidth + candleWidth / 2;
      final yOpen = size.height * (1 - (open - adjustedMin) / adjustedRange);
      final yClose = size.height * (1 - (close - adjustedMin) / adjustedRange);
      final yHigh = size.height * (1 - (high - adjustedMin) / adjustedRange);
      final yLow = size.height * (1 - (low - adjustedMin) / adjustedRange);

      // Wick
      final wickPaint = Paint()
        ..color = color
        ..strokeWidth = 1;
      canvas.drawLine(Offset(x, yHigh), Offset(x, yLow), wickPaint);

      // Body
      final bodyPaint = Paint()..color = color;
      final bodyTop = isGreen ? yClose : yOpen;
      final bodyBottom = isGreen ? yOpen : yClose;
      final bodyHeight = (bodyBottom - bodyTop).abs().clamp(1.0, double.infinity);

      canvas.drawRect(
        Rect.fromLTWH(
          x - (candleWidth - gap) / 2,
          bodyTop,
          candleWidth - gap,
          bodyHeight,
        ),
        bodyPaint,
      );
    }

    // Price labels on right
    final textStyle = TextStyle(
      color: Colors.white.withValues(alpha: 0.5),
      fontSize: 10,
    );
    for (int i = 0; i <= 4; i++) {
      final price = adjustedMax - (adjustedRange * i / 4);
      final y = size.height * i / 4;
      final tp = TextPainter(
        text: TextSpan(text: price.toStringAsFixed(1), style: textStyle),
        textDirection: TextDirection.ltr,
      )..layout();
      tp.paint(canvas, Offset(size.width - tp.width - 4, y - tp.height / 2));
    }
  }

  @override
  bool shouldRepaint(covariant _CandlestickPainter oldDelegate) {
    return oldDelegate.candles != candles;
  }
}
