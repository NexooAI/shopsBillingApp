import { useState, useEffect } from 'react';
import { translateToTamil, smartTranslate } from './translation';

/**
 * Hook for auto-translating English to Tamil in text inputs
 * @param englishText - The English text to translate from
 * @param initialTamilText - Initial Tamil text value
 * @returns [tamilText, setTamilText, handleTamilChange]
 */
export function useAutoTranslate(englishText: string, initialTamilText: string = '') {
  const [tamilText, setTamilText] = useState(initialTamilText);

  // Auto-translate when English text changes
  useEffect(() => {
    if (englishText && englishText.trim()) {
      const translated = smartTranslate(englishText, tamilText);
      if (translated && translated !== tamilText) {
        setTamilText(translated);
      }
    }
  }, [englishText]);

  // Handle manual Tamil text input (user can override)
  const handleTamilChange = (text: string) => {
    setTamilText(text);
  };

  return [tamilText, setTamilText, handleTamilChange] as const;
}

