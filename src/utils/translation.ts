// Offline English to Tamil Translation Service

// Common English to Tamil word dictionary
const translationDictionary: Record<string, string> = {
  // Common words
  'rice': 'அரிசி',
  'wheat': 'கோதுமை',
  'sugar': 'சர்க்கரை',
  'salt': 'உப்பு',
  'oil': 'எண்ணெய்',
  'dal': 'பருப்பு',
  'tomato': 'தக்காளி',
  'onion': 'வெங்காயம்',
  'potato': 'உருளைக்கிழங்கு',
  'carrot': 'கேரட்',
  'cabbage': 'முட்டைக்கோஸ்',
  'cauliflower': 'பூக்கோஸ்',
  'brinjal': 'கத்தரிக்காய்',
  'ladies finger': 'வெண்டை',
  'apple': 'ஆப்பிள்',
  'banana': 'வாழைப்பழம்',
  'orange': 'ஆரஞ்சு',
  'mango': 'மாம்பழம்',
  'grapes': 'திராட்சை',
  'milk': 'பால்',
  'curd': 'தயிர்',
  'butter': 'வெண்ணெய்',
  'cheese': 'பாலாடைக்கட்டி',
  'grocery': 'மளிகை',
  'vegetables': 'காய்கறிகள்',
  'fruits': 'பழங்கள்',
  'dairy': 'பால் பொருட்கள்',
  'beverages': 'பானங்கள்',
  'snacks': 'தின்பண்டங்கள்',
  'household': 'வீட்டு உபயோகப் பொருட்கள்',
  'personal care': 'தனிப்பட்ட பராமரிப்பு',
  'soap': 'சோப்பு',
  'shampoo': 'ஷாம்பூ',
  'toothpaste': 'பற்பசை',
  'bread': 'ரொட்டி',
  'biscuit': 'பிஸ்கட்',
  'tea': 'தேநீர்',
  'coffee': 'காபி',
  'water': 'தண்ணீர்',
  'juice': 'ஜூஸ்',
  'soft drink': 'குளிர்பானம்',
  'chocolate': 'சாக்லேட்',
  'ice cream': 'ஐஸ்கிரீம்',
  'egg': 'முட்டை',
  'chicken': 'கோழி',
  'fish': 'மீன்',
  'meat': 'இறைச்சி',
  'flour': 'மாவு',
  'spices': 'மசாலா',
  'turmeric': 'மஞ்சள்',
  'chilli': 'மிளகாய்',
  'pepper': 'மிளகு',
  'cumin': 'சீரகம்',
  'coriander': 'கொத்தமல்லி',
  'garlic': 'பூண்டு',
  'ginger': 'இஞ்சி',
  'green': 'பச்சை',
  'red': 'சிவப்பு',
  'yellow': 'மஞ்சள்',
  'white': 'வெள்ளை',
  'black': 'கருப்பு',
  'blue': 'நீலம்',
  'fresh': 'புதிய',
  'organic': 'கரிம',
  'premium': 'பிரீமியம்',
  'kg': 'கிலோ',
  'gram': 'கிராம்',
  'liter': 'லிட்டர்',
  'piece': 'துண்டு',
  'pack': 'பேக்',
  'bottle': 'பாட்டில்',
  'box': 'பெட்டி',
  'dozen': 'டஜன்',
  'packet': 'பாக்கெட்',
};

// Transliteration mapping (English to Tamil script)
const transliterationMap: Record<string, string> = {
  'a': 'அ', 'aa': 'ஆ', 'i': 'இ', 'ii': 'ஈ', 'u': 'உ', 'uu': 'ஊ',
  'e': 'எ', 'ee': 'ஏ', 'ai': 'ஐ', 'o': 'ஒ', 'oo': 'ஓ', 'au': 'ஔ',
  'ka': 'க', 'kha': 'க', 'ga': 'க', 'gha': 'க', 'nga': 'ங',
  'cha': 'ச', 'chha': 'ச', 'ja': 'ஜ', 'jha': 'ஜ', 'nya': 'ஞ',
  'ta': 'ட', 'tha': 'ட', 'da': 'ட', 'dha': 'ட', 'na': 'ண',
  'pa': 'ப', 'pha': 'ப', 'ba': 'ப', 'bha': 'ப', 'ma': 'ம',
  'ya': 'ய', 'ra': 'ர', 'la': 'ல', 'va': 'வ', 'sha': 'ஷ',
  'sa': 'ச', 'ha': 'ஹ', 'lla': 'ள', 'rra': 'ற', 'nna': 'ன',
};

// Vowel signs
const vowelSigns: Record<string, string> = {
  'a': '', 'aa': 'ா', 'i': 'ி', 'ii': 'ீ', 'u': 'ு', 'uu': 'ூ',
  'e': 'ெ', 'ee': 'ே', 'ai': 'ை', 'o': 'ொ', 'oo': 'ோ', 'au': 'ௌ',
};

/**
 * Transliterate English text to Tamil script (basic)
 */
function transliterateToTamil(text: string): string {
  const words = text.toLowerCase().split(/\s+/);
  const tamilWords: string[] = [];

  for (const word of words) {
    // Check if exact match in dictionary first
    if (translationDictionary[word]) {
      tamilWords.push(translationDictionary[word]);
      continue;
    }

    // Try to transliterate
    let tamilWord = '';
    let i = 0;
    while (i < word.length) {
      let matched = false;
      
      // Try 3-character combinations first
      if (i + 3 <= word.length) {
        const three = word.substring(i, i + 3);
        if (transliterationMap[three]) {
          tamilWord += transliterationMap[three];
          i += 3;
          matched = true;
        }
      }
      
      // Try 2-character combinations
      if (!matched && i + 2 <= word.length) {
        const two = word.substring(i, i + 2);
        if (transliterationMap[two]) {
          tamilWord += transliterationMap[two];
          i += 2;
          matched = true;
        }
      }
      
      // Try single character
      if (!matched && i + 1 <= word.length) {
        const one = word.charAt(i);
        if (transliterationMap[one]) {
          tamilWord += transliterationMap[one];
          i += 1;
        } else {
          // Keep original if no match
          tamilWord += one;
          i += 1;
        }
      }
    }
    
    tamilWords.push(tamilWord || word);
  }

  return tamilWords.join(' ');
}

/**
 * Translate English text to Tamil using dictionary
 */
export function translateToTamil(englishText: string): string {
  if (!englishText || englishText.trim() === '') {
    return '';
  }

  const text = englishText.toLowerCase().trim();
  
  // Check for exact match in dictionary
  if (translationDictionary[text]) {
    return translationDictionary[text];
  }

  // Check for phrase matches (e.g., "ice cream", "soft drink")
  for (const [key, value] of Object.entries(translationDictionary)) {
    if (text.includes(key)) {
      return text.replace(new RegExp(key, 'gi'), value);
    }
  }

  // Try word-by-word translation
  const words = text.split(/\s+/);
  const translatedWords = words.map(word => {
    // Remove punctuation for lookup
    const cleanWord = word.replace(/[.,!?;:]/g, '');
    
    if (translationDictionary[cleanWord]) {
      return translationDictionary[cleanWord];
    }
    
    // Try transliteration for unknown words
    return transliterateToTamil(cleanWord);
  });

  return translatedWords.join(' ');
}

/**
 * Auto-translate when English text is entered in Tamil field
 * This will be called when user types in Tamil text input
 */
export function autoTranslateToTamil(englishText: string, previousTamilText: string): string {
  // If user is typing in Tamil script, don't translate
  if (containsTamilScript(englishText)) {
    return englishText;
  }

  // If previous text was Tamil, keep it and append new translation
  if (previousTamilText && containsTamilScript(previousTamilText)) {
    const newText = englishText.replace(previousTamilText, '').trim();
    if (newText) {
      const translated = translateToTamil(newText);
      return previousTamilText + (translated ? ' ' + translated : '');
    }
    return previousTamilText;
  }

  // Translate the entire text
  return translateToTamil(englishText);
}

/**
 * Check if text contains Tamil script
 */
function containsTamilScript(text: string): boolean {
  // Tamil Unicode range: 0B80-0BFF
  return /[\u0B80-\u0BFF]/.test(text);
}

/**
 * Smart translation: If English is entered, auto-translate to Tamil
 * If Tamil is already entered, keep it
 */
export function smartTranslate(englishText: string, tamilText: string): string {
  // If Tamil text already exists and contains Tamil script, return as is
  if (tamilText && containsTamilScript(tamilText)) {
    return tamilText;
  }

  // If English text is provided, translate it
  if (englishText && !containsTamilScript(englishText)) {
    return translateToTamil(englishText);
  }

  return tamilText || '';
}

/**
 * Add custom translation to dictionary
 */
export function addCustomTranslation(english: string, tamil: string): void {
  translationDictionary[english.toLowerCase()] = tamil;
}

/**
 * Get all available translations
 */
export function getTranslationDictionary(): Record<string, string> {
  return { ...translationDictionary };
}

