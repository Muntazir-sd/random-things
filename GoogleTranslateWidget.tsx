'use client';

import { useGoogleTranslate } from '@/context/GoogleTranslateProvider/GoogleTranslateProvider';
import useGoogleTranslateWidget from '@/context/GoogleTranslateProvider/useGoogleTranslateWidget';

export default function GoogleTranslateWidget() {
  const { language } = useGoogleTranslate();
  useGoogleTranslateWidget(language);

  return <div id="google_translate_element" style={{ display: 'none' }} />;
}
