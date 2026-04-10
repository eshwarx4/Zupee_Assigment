import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';

class ApiService {
  static const String baseUrl = 'https://zupee-assigment.onrender.com';

  static Future<String?> _getAuthToken() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return null;
    return await user.getIdToken();
  }

  static String? _getCurrentUserId() {
    return FirebaseAuth.instance.currentUser?.uid;
  }

  static Future<Map<String, String>> _authHeaders() async {
    final token = await _getAuthToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  /// POST /chat — sends a message to AI and returns the response string.
  static Future<String> chatWithAI(String message) async {
    try {
      final headers = await _authHeaders();
      final response = await http.post(
        Uri.parse('$baseUrl/chat'),
        headers: headers,
        body: jsonEncode({'message': message}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        // Try common response shapes
        return data['response'] ??
            data['message'] ??
            data['reply'] ??
            data.toString();
      } else {
        throw Exception(
            'Chat request failed with status ${response.statusCode}: ${response.body}');
      }
    } catch (e) {
      throw Exception('Failed to get AI response: $e');
    }
  }

  /// POST /place-order — places a stock order.
  static Future<Map<String, dynamic>> placeOrder({
    required String symbol,
    required int quantity,
    required String type, // BUY or SELL
    required String product, // CNC or MIS
  }) async {
    try {
      final headers = await _authHeaders();
      final response = await http.post(
        Uri.parse('$baseUrl/place-order'),
        headers: headers,
        body: jsonEncode({
          'symbol': symbol,
          'quantity': quantity,
          'type': type,
          'product': product,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        return data;
      } else {
        throw Exception(data['error'] ?? data['message'] ?? 'Order failed');
      }
    } catch (e) {
      throw Exception('Failed to place order: $e');
    }
  }

  /// GET /portfolio — fetches the user's portfolio.
  static Future<Map<String, dynamic>> getPortfolio() async {
    try {
      final headers = await _authHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/portfolio'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception(
            'Portfolio fetch failed with status ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Failed to fetch portfolio: $e');
    }
  }

  /// GET /zerodha/status?userId=uid — checks Zerodha connection status.
  static Future<Map<String, dynamic>> getZerodhaStatus() async {
    try {
      final uid = _getCurrentUserId();
      if (uid == null) throw Exception('User not logged in');

      final headers = await _authHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/zerodha/status?userId=$uid'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        return {'connected': false};
      }
    } catch (e) {
      return {'connected': false};
    }
  }

  /// POST /zerodha/logout — disconnects Zerodha.
  static Future<Map<String, dynamic>> disconnectZerodha() async {
    try {
      final uid = _getCurrentUserId();
      if (uid == null) throw Exception('User not logged in');

      final headers = await _authHeaders();
      final response = await http.post(
        Uri.parse('$baseUrl/zerodha/logout'),
        headers: headers,
        body: jsonEncode({'userId': uid}),
      );

      return jsonDecode(response.body);
    } catch (e) {
      throw Exception('Failed to disconnect Zerodha: $e');
    }
  }

  /// Returns the backend URL for Zerodha login with the current userId.
  static String getZerodhaLoginUrl() {
    final uid = _getCurrentUserId();
    return '$baseUrl/zerodha/login?userId=$uid';
  }
}
