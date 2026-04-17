import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "app_name": "Bazaaro",
      "home_welcome": "Shop local, shop fresh.",
      "home_subtitle": "Find the best deals from nearby vendors.",
      "search_placeholder": "Search for milk, bread, etc...",
      "trending": "Trending Locally",
      "nearby_shops": "Nearby Shops",
      "add_to_cart": "Add to Cart",
      "out_of_stock": "Out of Stock",
      "my_orders": "My Orders",
      "profile": "Profile",
      "logout": "Logout",
      "login": "Login",
      "view_shop": "View Shop",
      "price_drop_alert": "Price Drop Alert!",
      "categories": "Categories",
      "no_shops": "No nearby shops found",
      "run_seed": "Run seed data to populate vendors!"
    }
  },
  hi: {
    translation: {
      "app_name": "बाज़ारो",
      "home_welcome": "स्थानीय खरीदें, ताज़ा खरीदें।",
      "home_subtitle": "आस-पास के विक्रेताओं से सर्वोत्तम सौदे खोजें।",
      "search_placeholder": "दूध, ब्रेड आदि खोजें...",
      "trending": "स्थानीय रूप से ट्रेंडिंग",
      "nearby_shops": "आस-पास की दुकानें",
      "add_to_cart": "कार्ट में डालें",
      "out_of_stock": "स्टॉक से बाहर",
      "my_orders": "मेरे ऑर्डर",
      "profile": "प्रोफ़ाइल",
      "logout": "लॉग आउट",
      "login": "लॉग इन",
      "view_shop": "दुकान देखें",
      "price_drop_alert": "कीमत में गिरावट!",
      "categories": "श्रेणियां",
      "no_shops": "आस-पास कोई दुकान नहीं मिली",
      "run_seed": "विक्रेताओं को जोड़ने के लिए डेटा भरें!"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;
