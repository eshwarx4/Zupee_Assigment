const express = require('express');
const router = express.Router();

/**
 * GET /chart-data
 * Proxies stock market data from Yahoo Finance.
 * 
 * Query params:
 *   symbol   - Stock symbol (e.g., "RELIANCE", "TCS", "GOLD")
 *   exchange - Exchange code (e.g., "NSE", "BSE", "MCX") 
 *   interval - Data interval ("1m", "5m", "15m", "1h", "1d", "1wk")
 *   range    - Data range ("1d", "5d", "1mo", "3mo", "6mo", "1y")
 */

// Map our symbols to Yahoo Finance tickers
function toYahooTicker(symbol, exchange) {
    // Normalize symbol: remove '1!' suffix and convert to uppercase
    const cleanSym = symbol.toUpperCase().replace(/1!$/, '').trim();
    const sym = symbol.toUpperCase().trim();
    const exch = (exchange || 'NSE').toUpperCase().trim();

    // Commodity mappings
    const commodityMap = {
        'GOLD': 'GC=F',
        'SILVER': 'SI=F',
        'CRUDE OIL': 'CL=F',
        'CRUDEOIL': 'CL=F',
        'NATURAL GAS': 'NG=F',
        'NATURALGAS': 'NG=F',
    };

    if (commodityMap[cleanSym]) return commodityMap[cleanSym];
    if (commodityMap[sym]) return commodityMap[sym];

    // Index mappings
    const indexMap = {
        'NIFTY': '^NSEI',
        'NIFTY 50': '^NSEI',
        'SENSEX': '^BSESN',
        'BANKNIFTY': '^NSEBANK',
        'BANK NIFTY': '^NSEBANK',
        'NIFTY IT': '^CNXIT',
        'CNXIT': '^CNXIT',
    };
    if (indexMap[sym]) return indexMap[sym];

    // ETF and stock mappings for Indian exchanges
    const exchangeSuffix = {
        'NSE': '.NS',
        'BSE': '.BO',
    };
    const suffix = exchangeSuffix[exch] || '.NS';

    return `${sym}${suffix}`;
}

router.get('/', async (req, res) => {
    try {
        const { symbol = 'NIFTY', exchange = 'NSE', interval = '1d', range = '6mo' } = req.query;

        const yahooTicker = toYahooTicker(symbol, exchange);

        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooTicker)}?interval=${interval}&range=${range}`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Failed to fetch chart data' });
        }

        const data = await response.json();
        const result = data?.chart?.result?.[0];

        if (!result) {
            return res.status(404).json({ error: 'No data found for this symbol' });
        }

        const timestamps = result.timestamp || [];
        const quote = result.indicators?.quote?.[0] || {};

        // Format OHLCV data for lightweight-charts
        const candles = timestamps.map((t, i) => ({
            time: t,
            open: quote.open?.[i] ?? null,
            high: quote.high?.[i] ?? null,
            low: quote.low?.[i] ?? null,
            close: quote.close?.[i] ?? null,
            volume: quote.volume?.[i] ?? null,
        })).filter(c => c.open !== null && c.close !== null);

        res.json({
            symbol: yahooTicker,
            currency: result.meta?.currency || 'INR',
            exchangeName: result.meta?.exchangeName || exchange,
            regularMarketPrice: result.meta?.regularMarketPrice,
            previousClose: result.meta?.previousClose,
            candles,
        });
    } catch (error) {
        console.error('Chart data error:', error.message);
        res.status(500).json({ error: 'Internal server error fetching chart data' });
    }
});

module.exports = router;
