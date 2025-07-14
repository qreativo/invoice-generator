import React, { useState, useEffect } from 'react';
import { Eye, FileText, Download, Check, X, List, ArrowLeft } from 'lucide-react';
import { InvoiceData } from './types/invoice';
import { User } from './types/user';
import { Header } from './components/Header';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoicePreview } from './components/InvoicePreview';
import { InvoiceList } from './components/InvoiceList';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { AdminPanel } from './components/AdminPanel';
import { PasswordResetForm } from './components/PasswordResetForm';
import { saveInvoiceData, loadInvoiceData, clearInvoiceData, saveInvoice, updateInvoiceStatus } from './utils/storage';
import { dataService } from './utils/dataService';
import { translations } from './utils/translations';
import { generateInvoiceNumber } from './utils/helpers';

const defaultInvoiceData: InvoiceData = {
  id: Date.now().toString(),
  invoiceNumber: generateInvoiceNumber(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  status: 'draft',
  date: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  
  companyName: '',
  companyAddress: '',
  companyPhone: '',
  companyEmail: '',
  companyWebsite: '',
  logo: undefined,
  
  clientName: '',
  clientAddress: '',
  clientPhone: '',
  clientEmail: '',
  
  items: [],
  
  subtotal: 0,
  taxRate: 0,
  taxAmount: 0,
  discountRate: 0,
  discountAmount: 0,
  total: 0,
  
  notes: '',
  terms: '',
  
  currency: 'USD',
  language: 'en',
  theme: 'modern'
};

function App() {
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(defaultInvoiceData);
  const [currentView, setCurrentView] = useState<'list' | 'form' | 'preview' | 'admin'>('list');
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | undefined>(undefined);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetToken, setResetToken] = useState<string | undefined>(undefined);
  const [showNotification, setShowNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const t = translations[invoiceData.language];

  useEffect(() => {
    // Initialize data service
    dataService.initialize();
    
    // Check for password reset token in URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      setResetToken(token);
      setShowPasswordReset(true);
      // Clear the token from URL for security
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    const savedData = loadInvoiceData();
    if (savedData) {
      setInvoiceData(savedData);
    }
    
    // Check for existing user session
    const user = dataService.getCurrentUser();
    setCurrentUser(user);
    
    // Listen for notification events from components
    const handleNotification = (event: any) => {
      showNotificationMessage(event.detail.message, event.detail.type);
    };
    
    window.addEventListener('showNotification', handleNotification);
    
    return () => {
      window.removeEventListener('showNotification', handleNotification);
    };
  }, []);

  const handleDataChange = (data: InvoiceData) => {
    setInvoiceData(data);
  };

  const handleSave = () => {
    const updatedData = { ...invoiceData, updatedAt: new Date().toISOString() };
    setInvoiceData(updatedData);
    saveInvoiceData(updatedData);
    dataService.saveInvoice(updatedData);
    
    // Auto-redirect to preview after save
    setCurrentView('preview');
    showNotificationMessage(t.invoiceSaved, 'success');
  };

  const handleClear = () => {
    const newInvoice = { 
      ...defaultInvoiceData, 
      id: Date.now().toString(),
      invoiceNumber: generateInvoiceNumber(),
      language: invoiceData.language,
      theme: invoiceData.theme
    };
    setInvoiceData(newInvoice);
    clearInvoiceData();
    setIsEditing(false);
    showNotificationMessage(t.invoiceCleared, 'success');
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setShowLogin(false);
    setShowRegister(false);
    showNotificationMessage(`Welcome back, ${user.username}!`, 'success');
  };

  const handleRegister = (user: User) => {
    setCurrentUser(user);
    setShowLogin(false);
    setShowRegister(false);
    showNotificationMessage(`Welcome to Lunara, ${user.username}!`, 'success');
  };

  const handleLogout = () => {
    dataService.logout();
    setCurrentUser(undefined);
    setCurrentView('list');
    showNotificationMessage('Logged out successfully', 'success');
  };
  const handlePasswordReset = () => {
    setShowPasswordReset(true);
  };


  const handleCreateNew = () => {
    const newInvoice = { 
      ...defaultInvoiceData, 
      id: Date.now().toString(),
      invoiceNumber: generateInvoiceNumber(),
      language: invoiceData.language,
      theme: invoiceData.theme
    };
    setInvoiceData(newInvoice);
    setIsEditing(false);
    setCurrentView('form');
  };

  const handleEditInvoice = (invoice: InvoiceData) => {
    setInvoiceData(invoice);
    setIsEditing(true);
    setCurrentView('form');
    saveInvoiceData(invoice);
  };

  const handleViewInvoice = (invoice: InvoiceData) => {
    setInvoiceData(invoice);
    setCurrentView('preview');
    saveInvoiceData(invoice);
  };

  const handleLanguageChange = (language: 'en' | 'id') => {
    const updatedData = { ...invoiceData, language };
    setInvoiceData(updatedData);
    saveInvoiceData(updatedData);
  };

  const handleThemeChange = (theme: string) => {
    const updatedData = { ...invoiceData, theme };
    setInvoiceData(updatedData);
    saveInvoiceData(updatedData);
  };

  const showNotificationMessage = (message: string, type: 'success' | 'error') => {
    setShowNotification({ message, type });
    setTimeout(() => setShowNotification(null), 3000);
  };

  const handleStatusChange = (newStatus: InvoiceData['status']) => {
    const updatedData = { 
      ...invoiceData, 
      status: newStatus,
      statusUpdatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setInvoiceData(updatedData);
    saveInvoiceData(updatedData);
    dataService.saveInvoice(updatedData);
    dataService.updateInvoiceStatus(updatedData.id, newStatus);
    
    showNotificationMessage(t.statusUpdated || 'Status updated successfully', 'success');
  };

  // Redirect to login if not authenticated
  if (!currentUser && !showLogin && !showRegister) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        <Header
          language={invoiceData.language}
          theme={invoiceData.theme}
          onLanguageChange={handleLanguageChange}
          onThemeChange={handleThemeChange}
          user={currentUser}
          onLogin={() => setShowLogin(true)}
          onLogout={handleLogout}
        />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="mb-8">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transform rotate-6 opacity-20"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-full shadow-lg">
                  <FileText className="h-12 w-12 text-white" />
                </div>
              </div>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Welcome to Lunara
            </h2>
            <p className="text-gray-600 mb-8 max-w-md">
              Professional invoice management system with multi-language support and real-time currency conversion.
            </p>
            <button
              onClick={() => setShowLogin(true)}
              className="group relative bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <div className="relative">Get Started</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show password reset form
  if (showPasswordReset) {
    return (
      <PasswordResetForm
        language={invoiceData.language}
        onBack={() => {
          setShowPasswordReset(false);
          setResetToken(undefined);
        }}
        token={resetToken}
      />
    );
  }

  // Show login form
  if (showLogin && !showRegister) {
    return (
      <LoginForm
        language={invoiceData.language}
        onLogin={handleLogin}
        onClose={() => setShowLogin(false)}
        onShowRegister={() => {
          setShowLogin(false);
          setShowRegister(true);
        }}
        onShowPasswordReset={() => {
          setShowLogin(false);
          setShowPasswordReset(true);
        }}
      />
    );
  }

  // Show register form
  if (showRegister) {
    return (
      <RegisterForm
        language={invoiceData.language}
        onRegister={handleRegister}
        onBackToLogin={() => {
          setShowRegister(false);
          setShowLogin(true);
        }}
      />
    );
  }

  const handlePrint = () => {
    try {
      // Ensure DOM is ready and stable before printing
      if (document.readyState === 'complete') {
        // Add small delay to ensure all styles are applied
        setTimeout(() => {
          window.print();
        }, 300);
      } else {
        // Wait for document to be ready
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => {
            window.print();
          }, 300);
        });
      }
    } catch (error) {
      console.error('Print error:', error);
      // Fallback: try direct print
      setTimeout(() => {
        try {
          window.print();
        } catch (fallbackError) {
          console.error('Fallback print error:', fallbackError);
          alert('Unable to open print dialog. Please try using Ctrl+P or Cmd+P');
        }
      }, 500);
    }
  };

  const handleBackToList = () => {
    setCurrentView('list');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <Header
        language={invoiceData.language}
        theme={invoiceData.theme}
        onLanguageChange={handleLanguageChange}
        onThemeChange={handleThemeChange}
        user={currentUser}
        onLogin={() => setShowLogin(true)}
        onLogout={handleLogout}
        onAdminPanel={() => setCurrentView('admin')}
        onPasswordReset={handlePasswordReset}
      />

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView !== 'list' && (
          <div className="mb-6">
            <button
              onClick={handleBackToList}
              className="group flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-300"
            >
              <ArrowLeft className="h-5 w-5 transform group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="font-medium">{t.backToList}</span>
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setCurrentView('list')}
              className={`group flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                currentView === 'list'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg'
              }`}
            >
              <List className="h-5 w-5" />
              <span>{t.invoiceList}</span>
            </button>
            {currentView !== 'list' && (
              <>
                <button
                  onClick={() => setCurrentView('form')}
                  className={`group flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                    currentView === 'form'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg'
                  }`}
                >
                  <FileText className="h-5 w-5" />
                  <span>{isEditing ? t.edit : t.create}</span>
                </button>
                <button
                  onClick={() => setCurrentView('preview')}
                  className={`group flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                    currentView === 'preview'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg'
                  }`}
                >
                  <Eye className="h-5 w-5" />
                  <span>{t.preview}</span>
                </button>
              </>
            )}
          </div>

          {currentView === 'preview' && (
            <button
              onClick={handlePrint}
              className="group flex items-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <Download className="h-5 w-5" />
              <span>{t.generatePdf}</span>
            </button>
          )}
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {currentView === 'admin' ? (
            <AdminPanel language={invoiceData.language} />
          ) : currentView === 'list' ? (
            <InvoiceList
              language={invoiceData.language}
              onCreateNew={handleCreateNew}
              onEditInvoice={handleEditInvoice}
              onViewInvoice={handleViewInvoice}
            />
          ) : currentView === 'form' ? (
            <InvoiceForm
              data={invoiceData}
              onDataChange={handleDataChange}
              onSave={handleSave}
              onClear={handleClear}
              language={invoiceData.language}
            />
          ) : (
            <InvoicePreview
              data={invoiceData}
              language={invoiceData.language}
              onStatusChange={handleStatusChange}
              showStatusDropdown={true}
            />
          )}
        </div>
      </div>

      {/* Notification with 3D Effect */}
      {showNotification && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="relative">
            <div className="absolute inset-0 bg-black opacity-20 rounded-xl transform rotate-1"></div>
            <div
              className={`relative flex items-center space-x-3 px-6 py-4 rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-300 ${
                showNotification.type === 'success'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                  : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
              }`}
            >
              {showNotification.type === 'success' ? (
                <Check className="h-6 w-6" />
              ) : (
                <X className="h-6 w-6" />
              )}
              <span className="font-medium">{showNotification.message}</span>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Print Styles */}
      <style jsx>{`
        @media print {
          /* Prevent print dialog crashes */
          * {
            transform: none !important;
            transition: none !important;
            animation: none !important;
            filter: none !important;
            backdrop-filter: none !important;
          }
          
          body * {
            visibility: hidden;
          }
          .print\\:shadow-none,
          .print\\:shadow-none * {
            visibility: visible;
          }
          .print\\:shadow-none {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            margin: 1in;
          }
          
          /* Remove problematic styles that can cause crashes */
          .animate-float,
          .animate-gradient,
          .group:hover,
          .hover\\:scale-105,
          .hover\\:shadow-xl {
            transform: none !important;
            animation: none !important;
            transition: none !important;
          }
        }
        
        /* 3D Animation Keyframes */
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(1deg); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        /* Gradient Animation */
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}

export default App;