import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.games': 'Games',
    'nav.profile': 'Profile',
    'nav.transactions': 'Transactions',
    'nav.logout': 'Logout',
    
    // Dashboard
    'dashboard.welcome': 'Welcome back',
    'dashboard.credits': 'Credits',
    'dashboard.balance': 'USD Balance',
    'dashboard.buyCredits': 'Buy Credits',
    'dashboard.redeemCredits': 'Redeem Credits',
    'dashboard.playNow': 'Play Now',
    'dashboard.recentTransactions': 'Recent Transactions',
    'dashboard.noTransactions': 'No transactions yet',
    'dashboard.noTransactionsDesc': 'Your transaction history will appear here once you make your first purchase or redemption.',
    'dashboard.viewAll': 'View All Transactions',
    'dashboard.gameLibrary': 'Game Library',
    'dashboard.goldenDragon': 'Golden Dragon',
    'dashboard.enterGame': 'Enter Game',
    'dashboard.purchaseInProgress': 'Purchase in Progress',
    
    // Profile
    'profile.title': 'Profile Settings',
    'profile.subtitle': 'Manage your account information and preferences',
    'profile.personalInfo': 'Personal Information',
    'profile.firstName': 'First Name',
    'profile.lastName': 'Last Name',
    'profile.email': 'Email Address',
    'profile.phone': 'Phone Number',
    'profile.location': 'Location',
    'profile.language': 'Language',
    'profile.english': 'English',
    'profile.spanish': 'Spanish',
    'profile.saveChanges': 'Save Changes',
    'profile.saving': 'Saving...',
    'profile.updateSuccess': 'Profile updated successfully!',
    
    // Games
    'games.title': 'Game Library',
    'games.subtitle': 'Choose from our selection of exciting games',
    'games.goldenDragon': 'Golden Dragon',
    'games.comingSoon': 'More games coming soon!',
    'games.enterGame': 'Enter Game',
    'games.playNow': 'Play Now',
    'games.lowCredits': 'Insufficient Credits',
    'games.lowCreditsDesc': 'You need more credits to play this game. Purchase credits to continue.',
    'games.buyCredits': 'Buy Credits',
    
    // Transactions
    'transactions.title': 'Transaction History',
    'transactions.subtitle': 'View all your credit purchases and redemptions',
    'transactions.noTransactions': 'No Transactions Yet',
    'transactions.noTransactionsDesc': 'Your transaction history will appear here once you make your first purchase or redemption.',
    'transactions.backToDashboard': 'Back to Dashboard',
    'transactions.type': 'Type',
    'transactions.amount': 'Amount',
    'transactions.value': 'USD Value',
    'transactions.status': 'Status',
    'transactions.date': 'Date',
    'transactions.loading': 'Loading transactions...',
    
    // Credit Purchase Modal
    'creditPurchase.title': 'Purchase Credits',
    'creditPurchase.subtitle': 'Select the amount of credits you\'d like to purchase',
    'creditPurchase.credits': 'Credits',
    'creditPurchase.customAmount': 'Custom Amount',
    'creditPurchase.enterCredits': 'Enter number of credits',
    'creditPurchase.requestPurchase': 'Request Purchase',
    'creditPurchase.requesting': 'Requesting...',
    'creditPurchase.cancel': 'Cancel',
    
    // Redeem Modal
    'redeem.title': 'Redeem Credits',
    'redeem.subtitle': 'Convert your credits to cash',
    'redeem.availableCredits': 'Available Credits',
    'redeem.redeemAmount': 'Redeem Amount',
    'redeem.enterCredits': 'Enter credits to redeem',
    'redeem.usdValue': 'USD Value',
    'redeem.requestRedemption': 'Request Redemption',
    'redeem.requesting': 'Requesting...',
    'redeem.cancel': 'Cancel',
    
    // Purchase Tracker
    'tracker.title': 'Purchase Progress',
    'tracker.pending': 'Purchase Pending',
    'tracker.pendingDesc': 'Request submitted to admin',
    'tracker.urlSent': 'Pay Link Sent',
    'tracker.urlSentDesc': 'Payment link generated',
    'tracker.processing': 'Payment Received',
    'tracker.processingDesc': 'Verifying completion',
    'tracker.completed': 'Credits Applied',
    'tracker.completedDesc': 'Added to your account',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.close': 'Close',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.continue': 'Continue',
    'common.back': 'Back',
  },
  es: {
    // Navigation
    'nav.dashboard': 'Tablero',
    'nav.games': 'Juegos',
    'nav.profile': 'Perfil',
    'nav.transactions': 'Transacciones',
    'nav.logout': 'Cerrar Sesión',
    
    // Dashboard
    'dashboard.welcome': 'Bienvenido de nuevo',
    'dashboard.credits': 'Créditos',
    'dashboard.balance': 'Saldo USD',
    'dashboard.buyCredits': 'Comprar Créditos',
    'dashboard.redeemCredits': 'Canjear Créditos',
    'dashboard.playNow': 'Jugar Ahora',
    'dashboard.recentTransactions': 'Transacciones Recientes',
    'dashboard.noTransactions': 'No hay transacciones aún',
    'dashboard.noTransactionsDesc': 'Tu historial de transacciones aparecerá aquí una vez que hagas tu primera compra o canje.',
    'dashboard.viewAll': 'Ver Todas las Transacciones',
    'dashboard.gameLibrary': 'Biblioteca de Juegos',
    'dashboard.goldenDragon': 'Dragón Dorado',
    'dashboard.enterGame': 'Entrar al Juego',
    'dashboard.purchaseInProgress': 'Compra en Progreso',
    
    // Profile
    'profile.title': 'Configuración de Perfil',
    'profile.subtitle': 'Administra tu información de cuenta y preferencias',
    'profile.personalInfo': 'Información Personal',
    'profile.firstName': 'Nombre',
    'profile.lastName': 'Apellido',
    'profile.email': 'Correo Electrónico',
    'profile.phone': 'Número de Teléfono',
    'profile.location': 'Ubicación',
    'profile.language': 'Idioma',
    'profile.english': 'Inglés',
    'profile.spanish': 'Español',
    'profile.saveChanges': 'Guardar Cambios',
    'profile.saving': 'Guardando...',
    'profile.updateSuccess': '¡Perfil actualizado exitosamente!',
    
    // Games
    'games.title': 'Biblioteca de Juegos',
    'games.subtitle': 'Elige entre nuestra selección de juegos emocionantes',
    'games.goldenDragon': 'Dragón Dorado',
    'games.comingSoon': '¡Más juegos próximamente!',
    'games.enterGame': 'Entrar al Juego',
    'games.playNow': 'Jugar Ahora',
    'games.lowCredits': 'Créditos Insuficientes',
    'games.lowCreditsDesc': 'Necesitas más créditos para jugar este juego. Compra créditos para continuar.',
    'games.buyCredits': 'Comprar Créditos',
    
    // Transactions
    'transactions.title': 'Historial de Transacciones',
    'transactions.subtitle': 'Ve todas tus compras de créditos y canjes',
    'transactions.noTransactions': 'No Hay Transacciones Aún',
    'transactions.noTransactionsDesc': 'Tu historial de transacciones aparecerá aquí una vez que hagas tu primera compra o canje.',
    'transactions.backToDashboard': 'Volver al Tablero',
    'transactions.type': 'Tipo',
    'transactions.amount': 'Cantidad',
    'transactions.value': 'Valor USD',
    'transactions.status': 'Estado',
    'transactions.date': 'Fecha',
    'transactions.loading': 'Cargando transacciones...',
    
    // Credit Purchase Modal
    'creditPurchase.title': 'Comprar Créditos',
    'creditPurchase.subtitle': 'Selecciona la cantidad de créditos que te gustaría comprar',
    'creditPurchase.credits': 'Créditos',
    'creditPurchase.customAmount': 'Cantidad Personalizada',
    'creditPurchase.enterCredits': 'Ingresa el número de créditos',
    'creditPurchase.requestPurchase': 'Solicitar Compra',
    'creditPurchase.requesting': 'Solicitando...',
    'creditPurchase.cancel': 'Cancelar',
    
    // Redeem Modal
    'redeem.title': 'Canjear Créditos',
    'redeem.subtitle': 'Convierte tus créditos en efectivo',
    'redeem.availableCredits': 'Créditos Disponibles',
    'redeem.redeemAmount': 'Cantidad a Canjear',
    'redeem.enterCredits': 'Ingresa los créditos a canjear',
    'redeem.usdValue': 'Valor USD',
    'redeem.requestRedemption': 'Solicitar Canje',
    'redeem.requesting': 'Solicitando...',
    'redeem.cancel': 'Cancelar',
    
    // Purchase Tracker
    'tracker.title': 'Progreso de Compra',
    'tracker.pending': 'Compra Pendiente',
    'tracker.pendingDesc': 'Solicitud enviada al administrador',
    'tracker.urlSent': 'Enlace de Pago Enviado',
    'tracker.urlSentDesc': 'Enlace de pago generado',
    'tracker.processing': 'Pago Recibido',
    'tracker.processingDesc': 'Verificando finalización',
    'tracker.completed': 'Créditos Aplicados',
    'tracker.completedDesc': 'Agregados a tu cuenta',
    
    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.close': 'Cerrar',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.continue': 'Continuar',
    'common.back': 'Atrás',
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}