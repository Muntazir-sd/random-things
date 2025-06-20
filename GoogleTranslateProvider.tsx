'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface GoogleTranslateContextProps {
  language: string;
  setLanguage: (lang: string) => void;
}

const GoogleTranslateContext = createContext<
  GoogleTranslateContextProps | undefined
>(undefined);

export function GoogleTranslateProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState('en');

  return (
    <GoogleTranslateContext.Provider value={{ language, setLanguage }}>
      {children}
    </GoogleTranslateContext.Provider>
  );
}

export function useGoogleTranslate() {
  const ctx = useContext(GoogleTranslateContext);
  if (!ctx)
    throw new Error(
      'useGoogleTranslate must be used within GoogleTranslateProvider'
    );
  return ctx;
}
