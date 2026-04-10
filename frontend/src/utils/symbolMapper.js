/**
 * Maps human-readable asset names to TradingView symbols.
 * Covers NSE/BSE stocks, MCX commodities, indices, and ETFs.
 */

const SYMBOL_MAP = {
    // --- Stocks (NSE) ---
    'RELIANCE': 'NSE:RELIANCE',
    'TCS': 'NSE:TCS',
    'INFOSYS': 'NSE:INFY',
    'INFY': 'NSE:INFY',
    'HDFC BANK': 'NSE:HDFCBANK',
    'HDFCBANK': 'NSE:HDFCBANK',
    'ICICI BANK': 'NSE:ICICIBANK',
    'ICICIBANK': 'NSE:ICICIBANK',
    'WIPRO': 'NSE:WIPRO',
    'BHARTI AIRTEL': 'NSE:BHARTIARTL',
    'BHARTIARTL': 'NSE:BHARTIARTL',
    'SBIN': 'NSE:SBIN',
    'SBI': 'NSE:SBIN',
    'ITC': 'NSE:ITC',
    'TATAMOTORS': 'NSE:TATAMOTORS',
    'TATA MOTORS': 'NSE:TATAMOTORS',
    'TATASTEEL': 'NSE:TATASTEEL',
    'TATA STEEL': 'NSE:TATASTEEL',
    'HCLTECH': 'NSE:HCLTECH',
    'ADANIENT': 'NSE:ADANIENT',
    'BAJFINANCE': 'NSE:BAJFINANCE',
    'LT': 'NSE:LT',
    'MARUTI': 'NSE:MARUTI',
    'SUNPHARMA': 'NSE:SUNPHARMA',
    'KOTAKBANK': 'NSE:KOTAKBANK',
    'AXISBANK': 'NSE:AXISBANK',

    // --- Indices ---
    'NIFTY': 'NSE:NIFTY',
    'NIFTY 50': 'NSE:NIFTY',
    'SENSEX': 'BSE:SENSEX',
    'BANKNIFTY': 'NSE:BANKNIFTY',
    'BANK NIFTY': 'NSE:BANKNIFTY',
    'NIFTY IT': 'NSE:CNXIT',
    'NIFTY PHARMA': 'NSE:CNXPHARMA',

    // --- Commodities (MCX) ---
    'GOLD': 'MCX:GOLD1!',
    'SILVER': 'MCX:SILVER1!',
    'CRUDE OIL': 'MCX:CRUDEOIL1!',
    'NATURAL GAS': 'MCX:NATURALGAS1!',

    // --- ETFs ---
    'NIFTYBEES': 'NSE:NIFTYBEES',
    'GOLDBEES': 'NSE:GOLDBEES',
    'BANKBEES': 'NSE:BANKBEES',
    'SILVERBEES': 'NSE:SILVERBEES',
    'LIQUIDBEES': 'NSE:LIQUIDBEES',
    'JUNIORBEES': 'NSE:JUNIORBEES',

    // --- Mutual Fund Fallbacks (approximate via index/ETF) ---
    'AXIS BLUECHIP': 'NSE:NIFTY',
    'SBI BLUECHIP': 'NSE:NIFTY',
    'MIRAE ASSET LARGE CAP': 'NSE:NIFTY',
    'HDFC TOP 100': 'NSE:NIFTY',
    'PARAG PARIKH FLEXI CAP': 'NSE:NIFTY',
};

/**
 * Maps a human-readable asset name to a TradingView symbol.
 * Falls back to NSE:<ASSET> if not found in the map.
 */
export function mapAssetToSymbol(asset) {
    if (!asset) return 'NSE:NIFTY';
    const key = asset.toUpperCase().trim();

    // Direct match
    if (SYMBOL_MAP[key]) return SYMBOL_MAP[key];

    // Already a TradingView symbol (contains colon)
    if (key.includes(':')) return key;

    // Fallback: assume NSE stock
    return `NSE:${key}`;
}

/**
 * Returns categorized asset lists for the ChartScreen picker.
 */
export function getAssetCategories() {
    return [
        {
            id: 'indices',
            label: 'Indices',
            assets: [
                { name: 'NIFTY 50', symbol: 'NSE:NIFTY' },
                { name: 'SENSEX', symbol: 'BSE:SENSEX' },
                { name: 'BANK NIFTY', symbol: 'NSE:BANKNIFTY' },
                { name: 'NIFTY IT', symbol: 'NSE:CNXIT' },
            ],
        },
        {
            id: 'stocks',
            label: 'Stocks',
            assets: [
                { name: 'RELIANCE', symbol: 'NSE:RELIANCE' },
                { name: 'TCS', symbol: 'NSE:TCS' },
                { name: 'INFOSYS', symbol: 'NSE:INFY' },
                { name: 'HDFC BANK', symbol: 'NSE:HDFCBANK' },
                { name: 'ICICI BANK', symbol: 'NSE:ICICIBANK' },
                { name: 'ITC', symbol: 'NSE:ITC' },
                { name: 'SBI', symbol: 'NSE:SBIN' },
                { name: 'TATA MOTORS', symbol: 'NSE:TATAMOTORS' },
                { name: 'WIPRO', symbol: 'NSE:WIPRO' },
                { name: 'BHARTI AIRTEL', symbol: 'NSE:BHARTIARTL' },
            ],
        },
        {
            id: 'commodities',
            label: 'Gold & Silver',
            assets: [
                { name: 'GOLD', symbol: 'MCX:GOLD1!' },
                { name: 'SILVER', symbol: 'MCX:SILVER1!' },
                { name: 'CRUDE OIL', symbol: 'MCX:CRUDEOIL1!' },
            ],
        },
        {
            id: 'etfs',
            label: 'ETFs',
            assets: [
                { name: 'NIFTYBEES', symbol: 'NSE:NIFTYBEES' },
                { name: 'GOLDBEES', symbol: 'NSE:GOLDBEES' },
                { name: 'BANKBEES', symbol: 'NSE:BANKBEES' },
                { name: 'SILVERBEES', symbol: 'NSE:SILVERBEES' },
            ],
        },
    ];
}
