import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'ur';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navbar
    'nav.sellItem': 'Sell Item',
    'nav.myListings': 'My Listings',
    'nav.favorites': 'Favorites',
    'nav.itemRequests': 'Item Requests',
    'nav.messages': 'Messages',
    'nav.analytics': 'Analytics',
    'nav.profile': 'Profile',
    'nav.adminPortal': 'Admin Portal',
    'nav.signOut': 'Sign Out',
    'nav.admin': 'Admin',
    'nav.signIn': 'Sign In',
    
    // Products Page
    'products.title': 'Discover Amazing Products',
    'products.subtitle': 'Find the best deals on campus',
    'products.search': 'Search for books, electronics, furniture...',
    'products.category': 'Category',
    'products.allCategories': 'All Categories',
    'products.condition': 'Condition',
    'products.allConditions': 'All Conditions',
    'products.new': 'New',
    'products.likeNew': 'Like New',
    'products.good': 'Good',
    'products.fair': 'Fair',
    'products.poor': 'Poor',
    'products.type': 'Type',
    'products.allTypes': 'All Types',
    'products.forSale': 'For Sale',
    'products.forExchange': 'For Exchange',
    'products.location': 'Location',
    'products.allLocations': 'All Locations',
    'products.priceRange': 'Price Range',
    'products.min': 'Min',
    'products.max': 'Max',
    'products.minPrice': 'Min Price',
    'products.maxPrice': 'Max Price',
    'products.clearFilters': 'Clear Filters',
    'products.clearAllFilters': 'Clear All Filters',
    'products.itemFound': 'item found',
    'products.itemsFound': 'items found',
    'products.sortBy': 'Sort By',
    'products.newest': 'Newest',
    'products.priceLowToHigh': 'Price: Low to High',
    'products.priceHighToLow': 'Price: High to Low',
    'products.noProducts': 'No products found',
    'products.tryAdjusting': 'Try adjusting your search or filters to find what you\'re looking for',
    
    // Product Card
    'product.sold': 'Sold',
    'product.unavailable': 'Unavailable',
    'product.negotiable': 'Negotiable',
    
    // Product Detail
    'detail.description': 'Description',
    'detail.condition': 'Condition',
    'detail.location': 'Location',
    'detail.postedOn': 'Posted on',
    'detail.seller': 'Seller',
    'detail.contactSeller': 'Contact Seller',
    'detail.addToFavorites': 'Add to Favorites',
    'detail.removeFromFavorites': 'Remove from Favorites',
    'detail.report': 'Report',
    'detail.edit': 'Edit',
    'detail.delete': 'Delete',
    'detail.markSold': 'Mark as Sold',
    'detail.markAvailable': 'Mark as Available',
    
    // Auth
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.fullName': 'Full Name',
    'auth.phone': 'Phone Number',
    'auth.dontHaveAccount': "Don't have an account?",
    'auth.alreadyHaveAccount': 'Already have an account?',
    'auth.signingIn': 'Signing in...',
    'auth.signingUp': 'Signing up...',
    
    // Add Product
    'addProduct.title': 'List Your Product',
    'addProduct.subtitle': 'Fill in the details to sell your item',
    'addProduct.productTitle': 'Product Title',
    'addProduct.enterTitle': 'Enter product title',
    'addProduct.price': 'Price (PKR)',
    'addProduct.enterPrice': 'Enter price',
    'addProduct.category': 'Category',
    'addProduct.selectCategory': 'Select category',
    'addProduct.condition': 'Condition',
    'addProduct.selectCondition': 'Select condition',
    'addProduct.description': 'Description',
    'addProduct.enterDescription': 'Describe your product...',
    'addProduct.location': 'Location',
    'addProduct.enterLocation': 'Enter location',
    'addProduct.images': 'Product Images',
    'addProduct.uploadImages': 'Upload images (max 5)',
    'addProduct.negotiable': 'Price is negotiable',
    'addProduct.cancel': 'Cancel',
    'addProduct.publish': 'Publish Product',
    'addProduct.publishing': 'Publishing...',
    
    // My Products
    'myProducts.title': 'My Listings',
    'myProducts.active': 'Active',
    'myProducts.sold': 'Sold',
    'myProducts.unavailable': 'Unavailable',
    'myProducts.noProducts': 'No products yet',
    'myProducts.startSelling': 'Start selling your items!',
    
    // Favorites
    'favorites.title': 'My Favorites',
    'favorites.noFavorites': 'No favorites yet',
    'favorites.startBrowsing': 'Start browsing to find items you love!',
    
    // Messages
    'messages.title': 'Messages',
    'messages.inquiryFrom': 'Inquiry from',
    'messages.chatWith': 'Chat with seller',
    'messages.noMessages': 'No messages yet',
    'messages.startConversation': 'Contact sellers to start a conversation',
    'messages.typeMessage': 'Type a message...',
    'messages.send': 'Send',
    
    // Requests
    'requests.title': 'Item Requests',
    'requests.browseRequests': 'Browse Requests',
    'requests.myRequests': 'My Requests',
    'requests.postRequest': 'Post a Request',
    'requests.whatLooking': 'What are you looking for?',
    'requests.enterTitle': 'Enter item title',
    'requests.budgetRange': 'Budget Range (PKR)',
    'requests.minBudget': 'Min',
    'requests.maxBudget': 'Max',
    'requests.details': 'Additional Details',
    'requests.enterDetails': 'Describe what you need...',
    'requests.submitRequest': 'Submit Request',
    'requests.submitting': 'Submitting...',
    'requests.responses': 'Responses',
    'requests.noResponses': 'No responses yet',
    'requests.respondToRequest': 'Respond to Request',
    
    // Admin
    'admin.dashboard': 'Admin Dashboard',
    'admin.management': 'FAST BAZAAR Management',
    'admin.announcements': 'Announcements',
    'admin.reports': 'Reports',
    'admin.logout': 'Logout',
    'admin.totalUsers': 'Total Users',
    'admin.totalProducts': 'Total Products',
    'admin.categories': 'Categories',
    'admin.engagement': 'Engagement',
    'admin.registeredAccounts': 'Registered accounts',
    'admin.productCategories': 'Product categories',
    'admin.totalFavorites': 'Total favorites',
    'admin.platformManagement': 'Platform Management',
    'admin.users': 'Users',
    'admin.products': 'Products',
    'admin.searchUsers': 'Search users by name or email...',
    'admin.name': 'Name',
    'admin.contact': 'Contact',
    'admin.location': 'Location',
    'admin.role': 'Role',
    'admin.joined': 'Joined',
    'admin.actions': 'Actions',
    'admin.makeAdmin': 'Make Admin',
    'admin.removeAdmin': 'Remove Admin',
    'admin.banUser': 'Ban User',
    'admin.unbanUser': 'Unban User',
    'admin.deleteUser': 'Delete User',
    'admin.you': 'You',
    'admin.user': 'User',
    'admin.banned': 'Banned',
    
    // Common
    'common.loading': 'Loading...',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.apply': 'Apply',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
    'common.confirm': 'Confirm',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.viewDetails': 'View Details',
  },
  ur: {
    // Navbar
    'nav.sellItem': 'چیز فروخت کریں',
    'nav.myListings': 'میری فہرستیں',
    'nav.favorites': 'پسندیدہ',
    'nav.itemRequests': 'چیزوں کی درخواستیں',
    'nav.messages': 'پیغامات',
    'nav.analytics': 'تجزیات',
    'nav.profile': 'پروفائل',
    'nav.adminPortal': 'ایڈمن پورٹل',
    'nav.signOut': 'سائن آؤٹ',
    'nav.admin': 'ایڈمن',
    'nav.signIn': 'سائن ان',
    
    // Products Page
    'products.title': 'حیرت انگیز مصنوعات دریافت کریں',
    'products.subtitle': 'کیمپس پر بہترین ڈیلز تلاش کریں',
    'products.search': 'کتابیں، الیکٹرانکس، فرنیچر تلاش کریں...',
    'products.category': 'زمرہ',
    'products.allCategories': 'تمام زمرے',
    'products.condition': 'حالت',
    'products.allConditions': 'تمام حالات',
    'products.new': 'نیا',
    'products.likeNew': 'نئے جیسا',
    'products.good': 'اچھا',
    'products.fair': 'ٹھیک ٹھاک',
    'products.poor': 'خراب',
    'products.type': 'قسم',
    'products.allTypes': 'تمام اقسام',
    'products.forSale': 'فروخت کے لیے',
    'products.forExchange': 'تبادلے کے لیے',
    'products.location': 'مقام',
    'products.allLocations': 'تمام مقامات',
    'products.priceRange': 'قیمت کی حد',
    'products.min': 'کم سے کم',
    'products.max': 'زیادہ سے زیادہ',
    'products.minPrice': 'کم سے کم قیمت',
    'products.maxPrice': 'زیادہ سے زیادہ قیمت',
    'products.clearFilters': 'فلٹرز صاف کریں',
    'products.clearAllFilters': 'تمام فلٹرز صاف کریں',
    'products.itemFound': 'چیز ملی',
    'products.itemsFound': 'چیزیں ملیں',
    'products.sortBy': 'ترتیب دیں',
    'products.newest': 'تازہ ترین',
    'products.priceLowToHigh': 'قیمت: کم سے زیادہ',
    'products.priceHighToLow': 'قیمت: زیادہ سے کم',
    'products.noProducts': 'کوئی مصنوعات نہیں ملیں',
    'products.tryAdjusting': 'اپنی تلاش یا فلٹرز کو ایڈجسٹ کر کے جو آپ تلاش کر رہے ہیں وہ تلاش کریں',
    
    // Product Card
    'product.sold': 'فروخت شدہ',
    'product.unavailable': 'دستیاب نہیں',
    'product.negotiable': 'قابل گفت و شنید',
    
    // Product Detail
    'detail.description': 'تفصیل',
    'detail.condition': 'حالت',
    'detail.location': 'مقام',
    'detail.postedOn': 'پوسٹ کیا گیا',
    'detail.seller': 'فروخت کنندہ',
    'detail.contactSeller': 'فروخت کنندہ سے رابطہ کریں',
    'detail.addToFavorites': 'پسندیدہ میں شامل کریں',
    'detail.removeFromFavorites': 'پسندیدہ سے ہٹائیں',
    'detail.report': 'رپورٹ کریں',
    'detail.edit': 'ترمیم کریں',
    'detail.delete': 'حذف کریں',
    'detail.markSold': 'فروخت شدہ نشان زد کریں',
    'detail.markAvailable': 'دستیاب نشان زد کریں',
    
    // Auth
    'auth.signIn': 'سائن ان',
    'auth.signUp': 'سائن اپ',
    'auth.email': 'ای میل',
    'auth.password': 'پاس ورڈ',
    'auth.fullName': 'پورا نام',
    'auth.phone': 'فون نمبر',
    'auth.dontHaveAccount': 'اکاؤنٹ نہیں ہے؟',
    'auth.alreadyHaveAccount': 'پہلے سے اکاؤنٹ ہے؟',
    'auth.signingIn': 'سائن ان ہو رہا ہے...',
    'auth.signingUp': 'سائن اپ ہو رہا ہے...',
    
    // Add Product
    'addProduct.title': 'اپنی مصنوعات کی فہرست بنائیں',
    'addProduct.subtitle': 'اپنی چیز فروخت کرنے کے لیے تفصیلات بھریں',
    'addProduct.productTitle': 'مصنوعات کا عنوان',
    'addProduct.enterTitle': 'مصنوعات کا عنوان درج کریں',
    'addProduct.price': 'قیمت (PKR)',
    'addProduct.enterPrice': 'قیمت درج کریں',
    'addProduct.category': 'زمرہ',
    'addProduct.selectCategory': 'زمرہ منتخب کریں',
    'addProduct.condition': 'حالت',
    'addProduct.selectCondition': 'حالت منتخب کریں',
    'addProduct.description': 'تفصیل',
    'addProduct.enterDescription': 'اپنی مصنوعات کی تفصیل بیان کریں...',
    'addProduct.location': 'مقام',
    'addProduct.enterLocation': 'مقام درج کریں',
    'addProduct.images': 'مصنوعات کی تصاویر',
    'addProduct.uploadImages': 'تصاویر اپ لوڈ کریں (زیادہ سے زیادہ 5)',
    'addProduct.negotiable': 'قیمت قابل گفت و شنید ہے',
    'addProduct.cancel': 'منسوخ کریں',
    'addProduct.publish': 'مصنوعات شائع کریں',
    'addProduct.publishing': 'شائع ہو رہا ہے...',
    
    // My Products
    'myProducts.title': 'میری فہرستیں',
    'myProducts.active': 'فعال',
    'myProducts.sold': 'فروخت شدہ',
    'myProducts.unavailable': 'دستیاب نہیں',
    'myProducts.noProducts': 'ابھی تک کوئی مصنوعات نہیں',
    'myProducts.startSelling': 'اپنی اشیاء فروخت کرنا شروع کریں!',
    
    // Favorites
    'favorites.title': 'میری پسندیدہ',
    'favorites.noFavorites': 'ابھی تک کوئی پسندیدہ نہیں',
    'favorites.startBrowsing': 'اپنی پسند کی اشیاء تلاش کرنے کے لیے براؤز کرنا شروع کریں!',
    
    // Messages
    'messages.title': 'پیغامات',
    'messages.inquiryFrom': 'سے استفسار',
    'messages.chatWith': 'فروخت کنندہ سے چیٹ کریں',
    'messages.noMessages': 'ابھی تک کوئی پیغامات نہیں',
    'messages.startConversation': 'بات چیت شروع کرنے کے لیے فروخت کنندگان سے رابطہ کریں',
    'messages.typeMessage': 'پیغام ٹائپ کریں...',
    'messages.send': 'بھیجیں',
    
    // Requests
    'requests.title': 'چیزوں کی درخواستیں',
    'requests.browseRequests': 'درخواستیں براؤز کریں',
    'requests.myRequests': 'میری درخواستیں',
    'requests.postRequest': 'درخواست پوسٹ کریں',
    'requests.whatLooking': 'آپ کیا تلاش کر رہے ہیں؟',
    'requests.enterTitle': 'چیز کا عنوان درج کریں',
    'requests.budgetRange': 'بجٹ کی حد (PKR)',
    'requests.minBudget': 'کم سے کم',
    'requests.maxBudget': 'زیادہ سے زیادہ',
    'requests.details': 'اضافی تفصیلات',
    'requests.enterDetails': 'بیان کریں کہ آپ کو کیا چاہیے...',
    'requests.submitRequest': 'درخواست جمع کرائیں',
    'requests.submitting': 'جمع ہو رہا ہے...',
    'requests.responses': 'جوابات',
    'requests.noResponses': 'ابھی تک کوئی جوابات نہیں',
    'requests.respondToRequest': 'درخواست کا جواب دیں',
    
    // Admin
    'admin.dashboard': 'ایڈمن ڈیش بورڈ',
    'admin.management': 'FAST BAZAAR انتظام',
    'admin.announcements': 'اعلانات',
    'admin.reports': 'رپورٹس',
    'admin.logout': 'لاگ آؤٹ',
    'admin.totalUsers': 'کل صارفین',
    'admin.totalProducts': 'کل مصنوعات',
    'admin.categories': 'زمرے',
    'admin.engagement': 'مصروفیت',
    'admin.registeredAccounts': 'رجسٹرڈ اکاؤنٹس',
    'admin.productCategories': 'مصنوعات کے زمرے',
    'admin.totalFavorites': 'کل پسندیدہ',
    'admin.platformManagement': 'پلیٹ فارم کا انتظام',
    'admin.users': 'صارفین',
    'admin.products': 'مصنوعات',
    'admin.searchUsers': 'نام یا ای میل سے صارفین تلاش کریں...',
    'admin.name': 'نام',
    'admin.contact': 'رابطہ',
    'admin.location': 'مقام',
    'admin.role': 'کردار',
    'admin.joined': 'شامل ہوئے',
    'admin.actions': 'اقدامات',
    'admin.makeAdmin': 'ایڈمن بنائیں',
    'admin.removeAdmin': 'ایڈمن ہٹائیں',
    'admin.banUser': 'صارف پر پابندی',
    'admin.unbanUser': 'پابندی ہٹائیں',
    'admin.deleteUser': 'صارف حذف کریں',
    'admin.you': 'آپ',
    'admin.user': 'صارف',
    'admin.banned': 'پابندی شدہ',
    
    // Common
    'common.loading': 'لوڈ ہو رہا ہے...',
    'common.search': 'تلاش کریں',
    'common.filter': 'فلٹر',
    'common.apply': 'لاگو کریں',
    'common.cancel': 'منسوخ کریں',
    'common.save': 'محفوظ کریں',
    'common.delete': 'حذف کریں',
    'common.edit': 'ترمیم کریں',
    'common.close': 'بند کریں',
    'common.confirm': 'تصدیق کریں',
    'common.yes': 'ہاں',
    'common.no': 'نہیں',
    'common.viewDetails': 'تفصیلات دیکھیں',
  },
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ur' ? 'rtl' : 'ltr';
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
