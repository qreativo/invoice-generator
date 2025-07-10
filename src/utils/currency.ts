export interface ExchangeRates {
  [key: string]: number;
}

export interface CurrencyConversionResponse {
  success: boolean;
  rates: ExchangeRates;
  base: string;
  date: string;
}

// Free API for exchange rates (no API key required)
const EXCHANGE_API_URL = 'https://api.exchangerate-api.com/v4/latest';

// Fallback rates in case API fails
const FALLBACK_RATES: ExchangeRates = {
  USD: 1,
  EUR: 0.85,
  GBP: 0.73,
  JPY: 110,
  IDR: 15000,
  SGD: 1.35,
  MYR: 4.2,
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
    const response = await fetch(`${EXCHANGE_API_URL}/${baseCurrency}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates');
    }
    
    const data: CurrencyConversionResponse = await response.json();
    
    if (data.success && data.rates) {
      cachedRates = data.rates;
      lastFetchTime = now;
      return data.rates;
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.warn('Failed to fetch exchange rates, using fallback:', error);
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

  // Convert to USD first if not already USD
  const usdAmount = fromCurrency === 'USD' ? amount : amount / (rates[fromCurrency] || 1);
  
  // Convert from USD to target currency
  const convertedAmount = toCurrency === 'USD' ? usdAmount : usdAmount * (rates[toCurrency] || 1);
  
  return convertedAmount;
};

export const getSupportedCurrencies = (): string[] => {
  return ['USD', 'EUR', 'GBP', 'JPY', 'IDR', 'SGD', 'MYR'];
};