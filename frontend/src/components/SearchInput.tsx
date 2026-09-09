import React, { useRef } from 'react';
import { Search, X } from 'lucide-react';

export interface SearchInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  onClear?: () => void;
  autoFocus?: boolean;
  disabled?: boolean;
  resultCount?: number;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  onClear,
  autoFocus = false,
  disabled = false,
  resultCount
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onChange('');
    if (onClear) onClear();
    inputRef.current?.focus();
  };

  return (
    <div
      className={`relative flex items-center rounded-xl border bg-white shadow-2xs transition-all ${
        disabled
          ? 'opacity-60 bg-slate-50 cursor-not-allowed border-slate-200'
          : 'border-slate-200 hover:border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-500/20'
      } ${className}`}
    >
      <div className="pl-3.5 pr-2 flex items-center justify-center text-slate-400 pointer-events-none">
        <Search className="w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
      </div>

      <input
        ref={inputRef}
        type="text"
        value={value}
        disabled={disabled}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full py-2.5 pr-2 text-xs font-medium text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
      />

      <div className="pr-3 flex items-center gap-1.5 shrink-0">
        {resultCount !== undefined && value.trim().length > 0 && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
            {resultCount} found
          </span>
        )}

        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
