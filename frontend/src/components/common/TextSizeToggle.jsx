import React, { useState, useEffect } from 'react';
import { Type } from 'lucide-react';

const TextSizeToggle = () => {
  const [isLargeText, setIsLargeText] = useState(() => {
    try {
      return localStorage.getItem('cou_text_size') === 'large';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isLargeText) {
      document.documentElement.classList.add('large-text');
      localStorage.setItem('cou_text_size', 'large');
    } else {
      document.documentElement.classList.remove('large-text');
      localStorage.setItem('cou_text_size', 'normal');
    }
  }, [isLargeText]);

  return (
    <button
      type="button"
      onClick={() => setIsLargeText((prev) => !prev)}
      aria-label={isLargeText ? 'Switch to Normal Text Size' : 'Switch to Large Text Size'}
      title={isLargeText ? 'স্বাভাবিক ফন্ট সাইজ' : 'বড় ফন্ট সাইজ (Large Text)'}
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
        isLargeText
          ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-sm'
          : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
      }`}
    >
      <Type className="w-3.5 h-3.5" />
      <span className="font-mono">{isLargeText ? 'A+' : 'A'}</span>
    </button>
  );
};

export default TextSizeToggle;

