export interface ExchangeRates {
  [key: string]: number;
}

export interface GoogleScriptApiResponse {
  success: boolean;
  data: {
    [key: string]: number;
  };
  updated_at_iso: string;
  updated_at_wib: string;
}

// Google Apps Script API configuration
const GOOGLE_SCRIPT_API_URL = 'https://script.googleusercontent.com/macros/echo?user_content_key=AehSKLgZ8EmJfPC5rwVFqWuHt3fxhJzgLRUg7XERQ1d3U1buxO5MDcnTbjBtsHL_orpNdkssjyKkMaA49VV7pBBZJOnK9ouHuJs216nMZKs5wJSv-W4059xPL5ThQzh0-DjvVh0avPi2YS0vjH9nQGRXtsxvpMJEoLtLRvyqsHibbi_JPAvA4sxngPXQTsSk_ZbtA3QTs_NNo87cwTt_sp_yxG3zyldissoJGog39sy5ShT_mmyFr3fKSppYKIdjXU7sWRKT70JhxbOC4mBYyvlKGC0_aWZOfw&lib=MhOYEOgrGdZKpTmg-ZbVKBRWesUIIKMc-';

// Fallback rates in case API fails
const FALLBACK_RATES: ExchangeRates = {
  USD: 1,
  EUR: 0.8550301162,
  GBP: 0.7411701084,
  JPY: 147.3829497468,
  IDR: 16220.337330249,
  SGD: 1.2791402259,
  MYR: 4.2562105087,
  AUD: 1.5196002493,
  CAD: 1.3685202727,
  CHF: 0.7961901364,
  CNY: 7.1756207251,
  HKD: 7.8478709762,
  INR: 85.8666642397,
  KRW: 1377.3219271667,
  THB: 32.3902754112,
  PHP: 56.4867205252,
  BRL: 5.5606408263,
  MXN: 18.6348418786,
};

let cachedRates: ExchangeRates | null = null;
let cachedUpdateTime: string | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export const fetchExchangeRates = async (baseCurrency = 'USD'): Promise<ExchangeRates> => {
  const now = Date.now();
  
  // Return cached rates if still valid
  if (cachedRates && (now - lastFetchTime) < CACHE_DURATION) {
    console.log('📦 Using cached exchange rates');
    return cachedRates;
  }

  try {
    console.log('📡 Fetching exchange rates...');
    const response = await fetch(GOOGLE_SCRIPT_API_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const apiResponse: GoogleScriptApiResponse = await response.json();
    
    if (apiResponse.success && apiResponse.data && typeof apiResponse.data === 'object') {
      const rates = apiResponse.data;
      
      // Ensure USD is always 1 when base is USD
      if (baseCurrency === 'USD' && !rates.USD) {
        rates.USD = 1;
      }
      
      cachedRates = rates;
      cachedUpdateTime = apiResponse.updated_at_wib || apiResponse.updated_at_iso;
      lastFetchTime = now;
      
      console.log('✅ Exchange rates updated successfully:', {
        timestamp: new Date().toLocaleString(),
        dataUpdatedAt: apiResponse.updated_at_wib,
        ratesCount: Object.keys(rates).length,
        baseCurrency,
        sampleRates: {
          USD: rates.USD,
          EUR: rates.EUR,
          IDR: rates.IDR,
          SGD: rates.SGD,
          MYR: rates.MYR
        }
      });
      
      return rates;
    } else {
      throw new Error(`API returned success: ${apiResponse.success}, but invalid data format`);
    }
  } catch (error) {
    console.warn('⚠️ Failed to fetch exchange rates:', error);
    console.log('📦 Using fallback rates');
    
    // Return fallback rates
    cachedRates = FALLBACK_RATES;
    cachedUpdateTime = 'Fallback data';
    lastFetchTime = now;
    return FALLBACK_RATES;
  }
};

export const convertCurrency = (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRates
): number => {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const fromRate = rates[fromCurrency];
  const toRate = rates[toCurrency];
  
  if (!fromRate || !toRate) {
    console.warn(`⚠️ Missing exchange rate for ${fromCurrency} (${fromRate}) or ${toCurrency} (${toRate})`);
    console.log('Available rates:', Object.keys(rates));
    return amount; // Return original amount if rates not available
  }

  // All rates are already relative to USD, so direct conversion
  let convertedAmount;
  
  if (fromCurrency === 'USD') {
    // From USD to target currency
    convertedAmount = amount * toRate;
  } else if (toCurrency === 'USD') {
    // From source currency to USD
    convertedAmount = amount / fromRate;
  } else {
    // From source currency to target currency via USD
    const usdAmount = amount / fromRate;
    convertedAmount = usdAmount * toRate;
  }
  
  console.log(`💱 Converting ${amount} ${fromCurrency} to ${toCurrency}: ${convertedAmount.toFixed(2)}`);
  
  return convertedAmount;
};

export const getSupportedCurrencies = (): string[] => {
  return [
    'USD', 'EUR', 'GBP', 'JPY', 'IDR', 'SGD', 'MYR', 
    'AUD', 'CAD', 'CHF', 'CNY', 'HKD', 'INR', 'KRW',
    'THB', 'PHP', 'BRL', 'MXN', 'BGN', 'CZK', 'DKK',
    'HRK', 'HUF', 'ILS', 'ISK', 'NOK', 'NZD', 'PLN',
    'RON', 'RUB', 'SEK', 'TRY', 'ZAR'
  ];
};

export const getCurrencyInfo = (currencyCode: string) => {
  const currencyMap: { [key: string]: { name: string; symbol: string } } = {
    USD: { name: 'US Dollar', symbol: '$' },
    EUR: { name: 'Euro', symbol: '€' },
    GBP: { name: 'British Pound', symbol: '£' },
    JPY: { name: 'Japanese Yen', symbol: '¥' },
    IDR: { name: 'Indonesian Rupiah', symbol: 'Rp' },
    SGD: { name: 'Singapore Dollar', symbol: 'S$' },
    MYR: { name: 'Malaysian Ringgit', symbol: 'RM' },
    AUD: { name: 'Australian Dollar', symbol: 'A$' },
    CAD: { name: 'Canadian Dollar', symbol: 'C$' },
    CHF: { name: 'Swiss Franc', symbol: 'CHF' },
    CNY: { name: 'Chinese Yuan', symbol: '¥' },
    HKD: { name: 'Hong Kong Dollar', symbol: 'HK$' },
    INR: { name: 'Indian Rupee', symbol: '₹' },
    KRW: { name: 'South Korean Won', symbol: '₩' },
    THB: { name: 'Thai Baht', symbol: '฿' },
    PHP: { name: 'Philippine Peso', symbol: '₱' },
    BRL: { name: 'Brazilian Real', symbol: 'R$' },
    MXN: { name: 'Mexican Peso', symbol: 'MX$' },
    BGN: { name: 'Bulgarian Lev', symbol: 'лв' },
    CZK: { name: 'Czech Koruna', symbol: 'Kč' },
    DKK: { name: 'Danish Krone', symbol: 'kr' },
    HRK: { name: 'Croatian Kuna', symbol: 'kn' },
    HUF: { name: 'Hungarian Forint', symbol: 'Ft' },
    ILS: { name: 'Israeli Shekel', symbol: '₪' },
    ISK: { name: 'Icelandic Krona', symbol: 'kr' },
    NOK: { name: 'Norwegian Krone', symbol: 'kr' },
    NZD: { name: 'New Zealand Dollar', symbol: 'NZ$' },
    PLN: { name: 'Polish Zloty', symbol: 'zł' },
    RON: { name: 'Romanian Leu', symbol: 'lei' },
    RUB: { name: 'Russian Ruble', symbol: '₽' },
    SEK: { name: 'Swedish Krona', symbol: 'kr' },
    TRY: { name: 'Turkish Lira', symbol: '₺' },
    ZAR: { name: 'South African Rand', symbol: 'R' },
  };
  
  return currencyMap[currencyCode] || { name: currencyCode, symbol: currencyCode };
};

// Function to get fresh rates (bypass cache)
export const refreshExchangeRates = async (baseCurrency = 'USD'): Promise<ExchangeRates> => {
  // Clear cache to force fresh fetch
  cachedRates = null;
  cachedUpdateTime = null;
  lastFetchTime = 0;
  
  console.log('🔄 Forcing fresh exchange rates fetch...');
  return await fetchExchangeRates(baseCurrency);
};

// Function to check if rates are cached and fresh
export const areCachedRatesFresh = (): boolean => {
  const now = Date.now();
  return cachedRates !== null && (now - lastFetchTime) < CACHE_DURATION;
};

// Function to get cache info
export const getCacheInfo = () => {
  return {
    hasCachedRates: cachedRates !== null,
    lastFetchTime: lastFetchTime ? new Date(lastFetchTime) : null,
    cacheAge: lastFetchTime ? Date.now() - lastFetchTime : 0,
    isExpired: !areCachedRatesFresh(),
    supportedCurrencies: getSupportedCurrencies().length,
    apiSource: 'Exchange Rate API',
    dataUpdatedAt: cachedUpdateTime
  };
};

// Function to get the last update time from API
export const getLastUpdateTime = (): string | null => {
  return cachedUpdateTime;
};