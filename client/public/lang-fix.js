// Language Fix - إصلاح مشكلة تغيير اللغة
(function() {
  // Store original content for each language
  const translations = {
    ar: {
      'الاسم': 'الاسم',
      'الصباح': 'الصباح',
      'الظهر': 'الظهر',
      'المساء': 'المساء',
      'ذروة الطاقة': 'ذروة الطاقة',
      'ساعات الفراغ': 'ساعات الفراغ',
      'اللغة': 'اللغة',
      'الإعدادات': 'الإعدادات',
      'التخصيص': 'التخصيص',
      'اليوم': 'اليوم',
      'مواعيد': 'مواعيد',
      'إحصاء': 'إحصاء',
      'أوسمة': 'أوسمة',
      'إعداد': 'إعداد'
    },
    de: {
      'الاسم': 'Name',
      'الصباح': 'Morgens',
      'الظهر': 'Mittags',
      'المساء': 'Abends',
      'ذروة الطاقة': 'Energiespitze',
      'ساعات الفراغ': 'Freizeit Stunden',
      'اللغة': 'Sprache',
      'الإعدادات': 'Einstellungen',
      'التخصيص': 'Personalisierung',
      'اليوم': 'Heute',
      'مواعيد': 'Termine',
      'إحصاء': 'Statistik',
      'أوسمة': 'Erfolge',
      'إعداد': 'Optionen'
    },
    en: {
      'الاسم': 'Name',
      'الصباح': 'Morning',
      'الظهر': 'Noon',
      'المساء': 'Evening',
      'ذروة الطاقة': 'Peak Energy',
      'ساعات الفراغ': 'Free Hours',
      'اللغة': 'Language',
      'الإعدادات': 'Settings',
      'التخصيص': 'Customization',
      'اليوم': 'Today',
      'مواعيد': 'Agenda',
      'إحصاء': 'Statistics',
      'أوسمة': 'Awards',
      'إعداد': 'Settings'
    }
  };

  // Watch for language changes
  const observer = new MutationObserver(function() {
    const htmlElement = document.documentElement;
    const currentLang = htmlElement.getAttribute('data-lang') || 
                       htmlElement.getAttribute('lang') || 
                       localStorage.getItem('app_lang') || 'ar';
    
    // Update all text nodes
    updatePageText(currentLang);
  });

  function updatePageText(lang) {
    const trans = translations[lang] || translations.ar;
    
    // Walk through all text nodes
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    while (node = walker.nextNode()) {
      const text = node.textContent.trim();
      
      // Check if this text needs translation
      for (const [key, value] of Object.entries(trans)) {
        if (text === key || text.includes(key)) {
          node.textContent = node.textContent.replace(key, value);
        }
      }
    }

    // Update HTML direction
    htmlElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    htmlElement.setAttribute('lang', lang);
  }

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true
  });

  // Initial update
  setTimeout(() => {
    const lang = localStorage.getItem('app_lang') || 'ar';
    updatePageText(lang);
  }, 500);
})();
