import React, { useRef } from 'react';
import { Calendar, Clock, X, Check, ChevronRight } from 'lucide-react';

export interface DatePickerProps {
  label?: string;
  value: string; // YYYY-MM-DD
  onChange: (val: string) => void;
  required?: boolean;
  min?: string;
  max?: string;
  placeholder?: string;
  disabled?: boolean;
  presets?: Array<{ label: string; daysOffset?: number; calculate?: () => string }>;
  className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  required = false,
  min,
  max,
  placeholder = 'Select date...',
  disabled = false,
  presets,
  className = ''
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpenPicker = () => {
    if (disabled) return;
    if (inputRef.current) {
      if (typeof inputRef.current.showPicker === 'function') {
        try {
          inputRef.current.showPicker();
        } catch {
          inputRef.current.focus();
        }
      } else {
        inputRef.current.focus();
      }
    }
  };

  // Format date to human-readable string (e.g. "Wed, Sep 9, 2026")
  const getFormattedDate = (isoDate: string) => {
    if (!isoDate) return '';
    try {
      const parts = isoDate.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const dateObj = new Date(year, month, day);
        if (!isNaN(dateObj.getTime())) {
          return dateObj.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        }
      }
    } catch {
      return isoDate;
    }
    return isoDate;
  };

  const humanDate = getFormattedDate(value);

  const applyPreset = (preset: { daysOffset?: number; calculate?: () => string }) => {
    if (preset.calculate) {
      onChange(preset.calculate());
      return;
    }
    if (preset.daysOffset !== undefined) {
      const d = new Date();
      d.setDate(d.getDate() + preset.daysOffset);
      onChange(d.toISOString().split('T')[0]);
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>{label}</span>
            {required && <span className="text-rose-500 font-bold">*</span>}
          </label>
          {humanDate && (
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
              {humanDate}
            </span>
          )}
        </div>
      )}

      {/* Main Interactive Date Input Container */}
      <div
        onClick={handleOpenPicker}
        className={`relative flex items-center rounded-xl border bg-white shadow-2xs transition-all cursor-pointer group ${
          disabled
            ? 'opacity-60 bg-slate-50 cursor-not-allowed border-slate-200'
            : 'border-slate-300 hover:border-blue-400 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-500/20'
        }`}
      >
        {/* Left Calendar Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenPicker();
          }}
          disabled={disabled}
          className="pl-3.5 pr-2 py-2.5 text-slate-400 group-hover:text-blue-600 transition flex items-center justify-center shrink-0"
          title="Open calendar picker"
        >
          <Calendar className="w-4 h-4 text-blue-600" />
        </button>

        {/* Native Date Input with transparent overlay or styled appearance */}
        <input
          ref={inputRef}
          type="date"
          required={required}
          min={min}
          max={max}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full py-2.5 pr-2 text-sm font-medium text-slate-800 bg-transparent focus:outline-none cursor-pointer"
        />

        {/* Action Controls on right */}
        <div className="pr-3 flex items-center gap-1.5 shrink-0">
          {value && !required && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-1 rounded-md text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition"
              title="Clear date"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenPicker();
            }}
            disabled={disabled}
            className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold transition flex items-center gap-1"
            title="Click to choose date"
          >
            <span>Pick</span>
            <ChevronRight className="w-3 h-3 text-blue-500" />
          </button>
        </div>
      </div>

      {/* Optional Preset Quick Select Pills */}
      {presets && presets.length > 0 && !disabled && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1 mr-0.5">
            <Clock className="w-3 h-3 text-slate-400" />
            Presets:
          </span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(p)}
              className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 text-slate-600 text-[11px] font-medium transition"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
