export interface ExchangeRates {
  [key: string]: number;
}

export interface FreeCurrencyApiResponse {
  data: ExchangeRates;
}

// FreeCurrencyAPI configuration
const FREE_CURRENCY_API_URL = 'https://api.freecurrencyapi.com/v1/latest';
const API_KEY = 'fca_live_3rkAGq5gIp2W0dQXTgmKpVRO0tjGn3nUhaEU5y33';

// Fallback rates in case API fails
const FALLBACK_RATES: ExchangeRates = {
  USD: 1,
  EUR: 0.855030161,
  GBP: 0.7411701097,
  JPY: 147.382952674,
  IDR: 16216.853501941,
  SGD: 1.2791401883,
  MYR: 4.2555508481,
  AUD: 1.5196001936,
  CAD: 1.3685201485,
  CHF: 0.7961901201,
  CNY: 7.1730707459,
  HKD: 7.8478710951,
  INR: 85.8407266938,
  KRW: 1377.3219668139,
  THB: 32.3902733578,
  PHP: 56.4856101298,
  BRL: 5.5606405901,
  MXN: 18.6348428438,
};

let cachedRates: ExchangeRates | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export const fetchExchangeRates = async (baseCurrency = 'USD'): Promise<ExchangeRates> => {
  const now = Date.now();
  
  // Return cached rates if still valid
  if (cachedRates && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedRates;
  }

  try {
    const url = `${FREE_CURRENCY_API_URL}?apikey=${API_KEY}&base_currency=${baseCurrency}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: FreeCurrencyApiResponse = await response.json();
    
    if (data.data && typeof data.data === 'object') {
      // Ensure USD is always 1 when base is USD
      const rates = { ...data.data };
      if (baseCurrency === 'USD' && !rates.USD) {
        rates.USD = 1;
      }
      
      cachedRates = rates;
      lastFetchTime = now;
      
      console.log('✅ Exchange rates updated successfully:', {
        timestamp: new Date().toLocaleString(),
        ratesCount: Object.keys(rates).length,
        baseCurrency
      });
      
      return rates;
    } else {
      throw new Error('Invalid response format from FreeCurrencyAPI');
    }
  } catch (error) {
    console.warn('⚠️ Failed to fetch exchange rates from FreeCurrencyAPI:', error);
    console.log('📦 Using fallback rates');
    
    // Return fallback rates
    cachedRates = FALLBACK_RATES;
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
    'THB', 'PHP', 'BRL', 'MXN'
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
  };
  
  return currencyMap[currencyCode] || { name: currencyCode, symbol: currencyCode };
};

// Function to get fresh rates (bypass cache)
export const refreshExchangeRates = async (baseCurrency = 'USD'): Promise<ExchangeRates> => {
  // Clear cache to force fresh fetch
  cachedRates = null;
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
    supportedCurrencies: getSupportedCurrencies().length
  };
};