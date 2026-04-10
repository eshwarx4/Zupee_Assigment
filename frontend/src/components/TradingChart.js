import React, { useState, useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Dimensions, Platform, Text } from 'react-native';

var SCREEN_WIDTH = Dimensions.get('window').width;
var BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://zupee-assigment.onrender.com';

var WebView = null;
if (Platform.OS !== 'web') {
    try {
        WebView = require('react-native-webview').WebView;
    } catch (e) {
        // WebView not available
    }
}

function getQueryParams(symbol) {
    var parts = symbol.split(':');
    if (parts.length === 2) {
        return { symbol: parts[1], exchange: parts[0] };
    }
    return { symbol: symbol, exchange: 'NSE' };
}

function mapInterval(interval) {
    var map = { '1': '1m', '5': '5m', '15': '15m', '60': '1h', 'D': '1d', 'W': '1wk' };
    return map[interval] || '1d';
}

function mapRange(interval) {
    var map = { '1': '1d', '5': '5d', '15': '5d', '60': '1mo', 'D': '6mo', 'W': '1y' };
    return map[interval] || '6mo';
}

function buildChartHTML(candles, theme, assetName, currency, currentPrice, previousClose) {
    var bgColor = theme === 'dark' ? '#131722' : '#ffffff';
    var textColor = theme === 'dark' ? '#d1d4dc' : '#333333';
    var gridColor = theme === 'dark' ? '#1e222d' : '#e0e0e0';
    var upColor = '#26a69a';
    var downColor = '#ef5350';

    var priceChange = currentPrice && previousClose ? (currentPrice - previousClose).toFixed(2) : null;
    var priceChangePercent = currentPrice && previousClose ? (((currentPrice - previousClose) / previousClose) * 100).toFixed(2) : null;
    var priceColor = priceChange >= 0 ? upColor : downColor;
    var arrow = priceChange >= 0 ? '▲' : '▼';

    var priceHTML = '';
    if (currentPrice) {
        priceHTML = '<span class="price" style="color:' + priceColor + '">' + currentPrice.toFixed(2) + ' ' + arrow + ' ' + Math.abs(priceChange) + ' (' + priceChangePercent + '%)</span>';
    }

    var candlesJSON = JSON.stringify(candles);

    var html = '<!DOCTYPE html>' +
        '<html><head>' +
        '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">' +
        '<style>' +
        '* { margin: 0; padding: 0; box-sizing: border-box; }' +
        'html, body { width: 100%; height: 100%; background: ' + bgColor + '; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }' +
        '#header { padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; }' +
        '#header .name { color: ' + textColor + '; font-size: 13px; font-weight: bold; }' +
        '#header .price { font-size: 13px; font-weight: bold; }' +
        '#chart { width: 100%; height: calc(100% - 35px); }' +
        '</style>' +
        '</head><body>' +
        '<div id="header">' +
        '<span class="name">' + assetName + ' (' + currency + ')</span>' +
        priceHTML +
        '</div>' +
        '<div id="chart"></div>' +
        '<script src="https://cdn.jsdelivr.net/npm/lightweight-charts@4.1.0/dist/lightweight-charts.standalone.production.js"></' + 'script>' +
        '<script>' +
        'try {' +
        '  var chart = LightweightCharts.createChart(document.getElementById("chart"), {' +
        '    layout: { background: { type: "solid", color: "' + bgColor + '" }, textColor: "' + textColor + '" },' +
        '    grid: { vertLines: { color: "' + gridColor + '" }, horzLines: { color: "' + gridColor + '" } },' +
        '    crosshair: { mode: LightweightCharts.CrosshairMode.Normal },' +
        '    rightPriceScale: { borderColor: "' + gridColor + '" },' +
        '    timeScale: { borderColor: "' + gridColor + '", timeVisible: true },' +
        '    handleScroll: true,' +
        '    handleScale: true' +
        '  });' +
        '  var series = chart.addCandlestickSeries({' +
        '    upColor: "' + upColor + '", downColor: "' + downColor + '",' +
        '    borderDownColor: "' + downColor + '", borderUpColor: "' + upColor + '",' +
        '    wickDownColor: "' + downColor + '", wickUpColor: "' + upColor + '"' +
        '  });' +
        '  var data = ' + candlesJSON + ';' +
        '  series.setData(data);' +
        '  chart.timeScale().fitContent();' +
        '  new ResizeObserver(function(entries) {' +
        '    var box = entries[0].contentRect;' +
        '    chart.applyOptions({ width: box.width, height: box.height });' +
        '  }).observe(document.getElementById("chart"));' +
        '} catch(e) {' +
        '  document.body.innerHTML = "<div style=\\"color:#888;text-align:center;padding:40px;\\">Chart error: " + e.message + "</div>";' +
        '}' +
        '</' + 'script>' +
        '</body></html>';

    return html;
}

export default function TradingChart(props) {
    var symbol = props.symbol || 'NSE:NIFTY';
    var interval = props.interval || 'D';
    var theme = props.theme || 'dark';
    var height = props.height || 420;

    var _loading = useState(true);
    var loading = _loading[0];
    var setLoading = _loading[1];

    var _error = useState(null);
    var error = _error[0];
    var setError = _error[1];

    var _chartHTML = useState('');
    var chartHTML = _chartHTML[0];
    var setChartHTML = _chartHTML[1];

    var bgColor = theme === 'dark' ? '#131722' : '#ffffff';

    useEffect(function () {
        var cancelled = false;

        setLoading(true);
        setError(null);

        var params = getQueryParams(symbol);
        var yahooInterval = mapInterval(interval);
        var range = mapRange(interval);

        var url = BACKEND_URL + '/chart-data?symbol=' + encodeURIComponent(params.symbol) + '&exchange=' + encodeURIComponent(params.exchange) + '&interval=' + yahooInterval + '&range=' + range;

        fetch(url)
            .then(function (res) {
                if (!res.ok) throw new Error('Failed to load chart data');
                return res.json();
            })
            .then(function (data) {
                if (cancelled) return;
                if (!data.candles || data.candles.length === 0) {
                    throw new Error('No data available for this symbol');
                }
                var html = buildChartHTML(
                    data.candles,
                    theme,
                    params.symbol,
                    data.currency || 'INR',
                    data.regularMarketPrice,
                    data.previousClose
                );
                setChartHTML(html);
                setLoading(false);
            })
            .catch(function (err) {
                if (!cancelled) {
                    setError(err.message);
                    setLoading(false);
                }
            });

        return function () { cancelled = true; };
    }, [symbol, interval, theme]);

    if (loading) {
        return (
            <View style={[styles.container, { height: height, backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#FF6B00" />
                <Text style={{ color: '#888', marginTop: 10, fontSize: 12 }}>Fetching market data...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, { height: height, backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#ef5350', fontSize: 14, fontWeight: 'bold' }}>⚠️ {error}</Text>
                <Text style={{ color: '#888', fontSize: 11, marginTop: 6 }}>Check backend or try a different symbol</Text>
            </View>
        );
    }

    if (Platform.OS === 'web') {
        return (
            <View key={symbol + '-' + interval} style={[styles.container, { height: height, backgroundColor: bgColor }]}>
                <iframe
                    srcDoc={chartHTML}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    title="Stock Chart"
                    sandbox="allow-scripts"
                />
            </View>
        );
    }

    if (!WebView) {
        return (
            <View style={[styles.container, { height: height, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#888' }}>WebView not available</Text>
            </View>
        );
    }

    return (
        <View key={symbol + '-' + interval} style={[styles.container, { height: height, backgroundColor: bgColor }]}>
            <WebView
                originWhitelist={['*']}
                source={{ html: chartHTML }}
                style={styles.webview}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                scrollEnabled={false}
            />
        </View>
    );
}

var styles = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: '#131722',
        borderRadius: 12,
        overflow: 'hidden',
    },
    webview: {
        flex: 1,
        backgroundColor: '#131722',
    },
});
