import { useEffect } from 'react';

function cleanUpGoogleTranslateArtifacts() {
  // Remove all Google Translate banners and frames
  document
    .querySelectorAll('.goog-te-banner-frame')
    .forEach((el) => el.remove());
  document
    .querySelectorAll('.goog-te-balloon-frame')
    .forEach((el) => el.remove());
  document.querySelectorAll('.goog-te-gadget').forEach((el) => el.remove());

  // Remove all <iframe> elements that Google injects
  document.querySelectorAll('iframe').forEach((el) => {
    if (el.src && el.src.includes('translate')) el.remove();
  });

  // Remove any classes Google adds to the body
  document.body.classList.remove(
    'goog-te-banner-frame',
    'translated-ltr',
    'translated-rtl'
  );
  document.body.style.top = '';
  // Remove their inline styles if any
  document.documentElement.style.transform = '';
}

export default function useGoogleTranslateWidget(language: string): void {
  useEffect(() => {
    cleanUpGoogleTranslateArtifacts();

    // Step 1: Remove widget
    const elem = document.getElementById('google_translate_element');
    if (elem) elem.innerHTML = '';

    // Step 2: Remove old script
    const oldScript = document.getElementById('google-translate-script');
    if (oldScript && oldScript.parentNode)
      oldScript.parentNode.removeChild(oldScript);

    // Step 3: Expire the cookie
    document.cookie =
      'googtrans=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT;';

    // Step 4: Set new cookie
    const cookieValue = language === 'en' ? '/en/en' : `/en/${language}`;
    document.cookie = `googtrans=${cookieValue};path=/;`;

    // Step 5: Delay widget init
    const timeout = setTimeout(() => {
      function googleTranslateElementInit() {
        // eslint-disable-next-line no-new
        new (window as any).google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            autoDisplay: false,
            includedLanguages: 'en,ar,fr,es,fa,ru,pt,zh-CN,id,ms,ha',
            layout: (window as any).google.translate.TranslateElement
              .InlineLayout.HORIZONTAL,
          },
          'google_translate_element'
        );
      }
      (window as any).googleTranslateElementInit = googleTranslateElementInit;

      // Load script
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src =
        '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      document.body.appendChild(script);

      if (typeof window !== 'undefined') {
        if (document.querySelectorAll('#google_translate_element').length > 1) {
          // eslint-disable-next-line no-console
          console.warn('Duplicate Google Translate widget detected!');
        }
      }
    }, 100); // You may need 800ms or even 1000ms for heavy pages

    return () => {
      clearTimeout(timeout);
      cleanUpGoogleTranslateArtifacts();
      const script = document.getElementById('google-translate-script');
      if (script && script.parentNode) script.parentNode.removeChild(script);
    };
  }, [language]);
}
