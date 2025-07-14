import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit, Trash2, FileText, Calendar, DollarSign, Clock, CheckCircle, AlertCircle, XCircle, RefreshCw } from 'lucide-react';
import { InvoiceData } from '../types/invoice';
import { getAllInvoices, deleteInvoice, searchInvoices } from '../utils/storage';
import { formatCurrency, formatDate } from '../utils/helpers';
import { translations } from '../utils/translations';
import { CurrencySelector } from './CurrencySelector';
import { fetchExchangeRates, convertCurrency, ExchangeRates, getLastUpdateTime } from '../utils/currency';

interface InvoiceListProps {
  language: 'en' | 'id';
  onCreateNew: () => void;
  onEditInvoice: (invoice: InvoiceData) => void;
  onViewInvoice: (invoice: InvoiceData) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  language,
  onCreateNew,
  onEditInvoice,
  onViewInvoice
}) => {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceData[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [displayCurrency, setDisplayCurrency] = useState<string>('USD');
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const t = translations[language];

  useEffect(() => {
    loadInvoices();
    loadExchangeRates();
  }, []);

  useEffect(() => {
    filterAndSortInvoices();
  }, [invoices, searchQuery, selectedStatus, sortBy, sortOrder]);

  useEffect(() => {
    if (Object.keys(exchangeRates).length > 0) {
      filterAndSortInvoices();
    }
  }, [displayCurrency, exchangeRates]);

  const loadInvoices = () => {
    const allInvoices = getAllInvoices();
    setInvoices(allInvoices);
  };

  const loadExchangeRates = async () => {
    setIsLoadingRates(true);
    try {
      console.log('📡 Loading exchange rates...');
      const rates = await fetchExchangeRates();
      console.log('✅ Exchange rates loaded:', rates);
      setExchangeRates(rates);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load exchange rates:', error);
    } finally {
      setIsLoadingRates(false);
    }
  };

  const refreshExchangeRates = async () => {
    setIsLoadingRates(true);
    try {
      console.log('🔄 Refreshing exchange rates...');
      // Import the refresh function from currency utils
      const { refreshExchangeRates: forceRefresh } = await import('../utils/currency');
      const rates = await forceRefresh();
      console.log('✅ Fresh exchange rates loaded:', rates);
      setExchangeRates(rates);
      setLastUpdated(new Date());
      
      // Show success message
      const event = new CustomEvent('showNotification', {
        detail: { message: 'Exchange rates updated successfully!', type: 'success' }
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('❌ Failed to refresh exchange rates:', error);
      // Show error message
      const event = new CustomEvent('showNotification', {
        detail: { message: 'Failed to refresh exchange rates', type: 'error' }
      });
      window.dispatchEvent(event);
    } finally {
      setIsLoadingRates(false);
    }
  };

  const convertAmount = (amount: number, fromCurrency: string): number => {
    if (Object.keys(exchangeRates).length === 0) return amount;
    return convertCurrency(amount, fromCurrency, displayCurrency, exchangeRates);
  };

  const filterAndSortInvoices = () => {
    let filtered = searchQuery ? searchInvoices(searchQuery) : invoices;
    
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === selectedStatus);
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          const convertedAmountA = convertAmount(a.total, a.currency);
          const convertedAmountB = convertAmount(b.total, b.currency);
          comparison = convertedAmountA - convertedAmountB;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredInvoices(filtered);
  };

  const handleDeleteInvoice = (id: string) => {
    if (window.confirm(t.confirmDelete || 'Are you sure you want to delete this invoice?')) {
      deleteInvoice(id);
      loadInvoices();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + convertAmount(invoice.total, invoice.currency), 0);
  const paidAmount = filteredInvoices.filter(inv => inv.status === 'paid').reduce((sum, invoice) => sum + convertAmount(invoice.total, invoice.currency), 0);
  const pendingAmount = totalAmount - paidAmount;

  return (
    <div className="space-y-6">
      {/* Header with 3D Effect */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl transform rotate-1 opacity-20"></div>
        <div className="relative bg-white rounded-2xl shadow-2xl p-8 transform hover:scale-[1.02] transition-all duration-300">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {t.invoiceList || 'Invoice List'}
              </h2>
              <p className="text-gray-600 mt-2">{t.manageInvoices || 'Manage all your invoices'}</p>
            </div>
            <button
              onClick={onCreateNew}
              className="group relative bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <div className="relative flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>{t.createNew || 'Create New'}</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards with 3D Effects */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: t.totalAmount || 'Total Amount', value: formatCurrency(totalAmount, displayCurrency), icon: DollarSign, color: 'from-blue-500 to-blue-600' },
          { label: t.paidAmount || 'Paid Amount', value: formatCurrency(paidAmount, displayCurrency), icon: CheckCircle, color: 'from-green-500 to-green-600' },
          { label: t.pendingAmount || 'Pending Amount', value: formatCurrency(pendingAmount, displayCurrency), icon: Clock, color: 'from-orange-500 to-orange-600' }
        ].map((stat, index) => (
          <div key={index} className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r opacity-20 rounded-xl transform rotate-1 group-hover:rotate-2 transition-transform duration-300" style={{ background: `linear-gradient(to right, ${stat.color.split(' ')[1]}, ${stat.color.split(' ')[3]})` }}></div>
            <div className="relative bg-white rounded-xl shadow-lg p-6 transform group-hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color} shadow-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Currency Selector and Exchange Rate Info */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <CurrencySelector
              selectedCurrency={displayCurrency}
              onCurrencyChange={setDisplayCurrency}
              label={t.displayCurrency || 'Display Currency'}
            />
            <button
              onClick={refreshExchangeRates}
              disabled={isLoadingRates}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingRates ? 'animate-spin' : ''}`} />
              <span>{t.refreshRates || 'Refresh Rates'}</span>
            </button>
          </div>
          {lastUpdated && (
            <div className="text-sm text-gray-600">
              <div className="flex flex-col">
                <span>{t.lastUpdated || 'Last updated'}: {lastUpdated.toLocaleTimeString()}</span>
                {getLastUpdateTime() && (
                  <span className="text-xs text-gray-500">
                    Data: {getLastUpdateTime()}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={t.searchInvoices || 'Search invoices...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
            />
          </div>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
          >
            <option value="all">{t.allStatus || 'All Status'}</option>
            <option value="draft">{t.draft || 'Draft'}</option>
            <option value="pending">{t.pending || 'Pending'}</option>
            <option value="paid">{t.paid || 'Paid'}</option>
            <option value="cancelled">{t.cancelled || 'Cancelled'}</option>
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field as 'date' | 'amount' | 'status');
              setSortOrder(order as 'asc' | 'desc');
            }}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
          >
            <option value="date-desc">{t.newestFirst || 'Newest First'}</option>
            <option value="date-asc">{t.oldestFirst || 'Oldest First'}</option>
            <option value="amount-desc">{t.highestAmount || 'Highest Amount'}</option>
            <option value="amount-asc">{t.lowestAmount || 'Lowest Amount'}</option>
          </select>
        </div>
      </div>

      {/* Invoice Cards with 3D Effects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredInvoices.map((invoice) => (
          <div key={invoice.id} className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl transform rotate-1 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
            <div className="relative bg-white rounded-xl shadow-lg hover:shadow-2xl p-6 transform group-hover:scale-105 transition-all duration-300 border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{invoice.invoiceNumber}</h3>
                    <p className="text-sm text-gray-600">{invoice.clientName}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                  {getStatusIcon(invoice.status)}
                  <span className="capitalize">{invoice.status}</span>
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{t.date || 'Date'}</span>
                  </span>
                  <span className="font-medium">{formatDate(invoice.date)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center space-x-1">
                    <DollarSign className="h-4 w-4" />
                    <span>{t.amount || 'Amount'}</span>
                  </span>
                  <div className="text-right">
                    <span className="font-bold text-lg">{formatCurrency(convertAmount(invoice.total, invoice.currency), displayCurrency)}</span>
                    {invoice.currency !== displayCurrency && (
                      <div className="text-xs text-gray-500">
                        {formatCurrency(invoice.total, invoice.currency)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onViewInvoice(invoice)}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center justify-center space-x-1 text-sm font-medium"
                >
                  <Eye className="h-4 w-4" />
                  <span>{t.view || 'View'}</span>
                </button>
                <button
                  onClick={() => onEditInvoice(invoice)}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-4 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 flex items-center justify-center space-x-1 text-sm font-medium"
                >
                  <Edit className="h-4 w-4" />
                  <span>{t.edit || 'Edit'}</span>
                </button>
                <button
                  onClick={() => handleDeleteInvoice(invoice.id)}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white py-2 px-3 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 flex items-center justify-center"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredInvoices.length === 0 && (
        <div className="text-center py-12">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full w-24 h-24 mx-auto transform rotate-12 opacity-50"></div>
            <div className="relative bg-gray-100 rounded-full w-24 h-24 mx-auto flex items-center justify-center mb-4">
              <FileText className="h-12 w-12 text-gray-400" />
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t.noInvoicesFound || 'No invoices found'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery 
              ? (t.noInvoicesMatchSearch || 'No invoices match your search criteria')
              : (t.createFirstInvoice || 'Create your first invoice to get started')
            }
          </p>
          <button
            onClick={onCreateNew}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300"
          >
            {t.createNew || 'Create New Invoice'}
          </button>
        </div>
      )}
    </div>
  );
};