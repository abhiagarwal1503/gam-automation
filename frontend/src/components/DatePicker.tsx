import React, { useRef } from 'react';
import { Calendar, Clock, X, ChevronRight } from 'lucide-react';

export interface DatePickerProps {
  label?: string;
  value: string; // YYYY-MM-DD or YYYY-MM-DDTHH:mm
  onChange: (val: string) => void;
  required?: boolean;
  min?: string;
  max?: string;
  placeholder?: string;
  disabled?: boolean;
  presets?: Array<{ label: string; daysOffset?: number; calculate?: () => string }>;
  className?: string;
  showTime?: boolean;
  defaultTime?: string; // e.g. '00:00' or '23:59'
  timeLabel?: string;
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
  className = '',
  showTime = false,
  defaultTime,
  timeLabel = 'Time'
}) => {
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Split value into date and time parts
  let datePart = '';
  let timePart = '';

  if (value) {
    if (value.includes('T')) {
      const [d, t] = value.split('T');
      datePart = d || '';
      timePart = (t || '').slice(0, 5);
    } else if (value.includes(' ')) {
      const [d, t] = value.split(' ');
      datePart = d || '';
      timePart = (t || '').slice(0, 5);
    } else {
      datePart = value;
    }
  }

  // Fallback time if showTime is enabled
  const effectiveTime = timePart || defaultTime || '00:00';

  const handleDateChange = (newDate: string) => {
    if (!newDate) {
      onChange('');
      return;
    }
    if (showTime) {
      onChange(`${newDate}T${effectiveTime}`);
    } else {
      onChange(newDate);
    }
  };

  const handleTimeChange = (newTime: string) => {
    const activeDate = datePart || new Date().toISOString().split('T')[0];
    onChange(`${activeDate}T${newTime}`);
  };

  const handleOpenDatePicker = () => {
    if (disabled) return;
    if (dateInputRef.current) {
      if (typeof dateInputRef.current.showPicker === 'function') {
        try {
          dateInputRef.current.showPicker();
        } catch {
          dateInputRef.current.focus();
        }
      } else {
        dateInputRef.current.focus();
      }
    }
  };

  // Format date and time to human-readable string
  const getFormattedDate = (dStr: string, tStr?: string) => {
    if (!dStr) return '';
    try {
      const parts = dStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const dateObj = new Date(year, month, day);
        if (!isNaN(dateObj.getTime())) {
          const dateFormatted = dateObj.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
          if (showTime && tStr) {
            return `${dateFormatted} • ${tStr}`;
          }
          return dateFormatted;
        }
      }
    } catch {
      return dStr;
    }
    return dStr;
  };

  const humanDate = getFormattedDate(datePart, effectiveTime);

  const applyPreset = (preset: { daysOffset?: number; calculate?: () => string }) => {
    let chosenDate = '';
    if (preset.calculate) {
      chosenDate = preset.calculate();
    } else if (preset.daysOffset !== undefined) {
      const d = new Date();
      d.setDate(d.getDate() + preset.daysOffset);
      chosenDate = d.toISOString().split('T')[0];
    }

    if (chosenDate) {
      const cleanDate = chosenDate.includes('T') ? chosenDate.split('T')[0] : chosenDate;
      if (showTime) {
        onChange(`${cleanDate}T${effectiveTime}`);
      } else {
        onChange(cleanDate);
      }
    }
  };

  const cleanMin = min ? (min.includes('T') ? min.split('T')[0] : min.split(' ')[0]) : undefined;
  const cleanMax = max ? (max.includes('T') ? max.split('T')[0] : max.split(' ')[0]) : undefined;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header / Label Strip */}
      {label && (
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 select-none">
            <span className="p-1 rounded-md bg-blue-50 text-blue-600 border border-blue-100/80 shrink-0">
              <Calendar className="w-3.5 h-3.5" />
            </span>
            <span>{label}</span>
            {required && <span className="text-rose-500 font-bold">*</span>}
          </label>

          {humanDate && (
            <span className="text-xs font-semibold text-blue-700 bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-blue-50/90 px-2.5 py-1 rounded-lg border border-blue-200/60 shadow-2xs flex items-center gap-1.5 shrink-0 transition-all">
              {showTime && <Clock className="w-3 h-3 text-blue-500 shrink-0" />}
              <span>{humanDate}</span>
            </span>
          )}
        </div>
      )}

      {/* Main Interactive Input Bar */}
      <div
        className={`flex flex-col sm:flex-row items-stretch sm:items-center rounded-2xl border bg-white shadow-2xs transition-all ${
          disabled
            ? 'opacity-60 bg-slate-50 cursor-not-allowed border-slate-200'
            : 'border-slate-200 hover:border-slate-300 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-500/15'
        }`}
      >
        {/* Date Input Section */}
        <div
          onClick={handleOpenDatePicker}
          className="relative flex-1 flex items-center min-w-0 cursor-pointer group py-1 sm:py-0.5"
        >
          {/* Calendar Icon Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDatePicker();
            }}
            disabled={disabled}
            className="pl-3.5 pr-2.5 py-2 text-slate-400 group-hover:text-blue-600 transition flex items-center justify-center shrink-0"
            title="Open calendar"
          >
            <Calendar className="w-4 h-4 text-blue-600" />
          </button>

          {/* Native Date Input */}
          <input
            ref={dateInputRef}
            type="date"
            required={required}
            min={cleanMin}
            max={cleanMax}
            value={datePart}
            disabled={disabled}
            onChange={(e) => handleDateChange(e.target.value)}
            placeholder={placeholder}
            className="w-full py-2 pr-2 text-sm font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer placeholder-slate-400 min-w-0"
          />

          {/* Clear & Pick Buttons */}
          <div className="pr-3 flex items-center gap-1.5 shrink-0">
            {value && !required && !disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                }}
                className="p-1 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition"
                title="Clear date"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDatePicker();
              }}
              disabled={disabled}
              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-700 text-xs font-bold transition flex items-center gap-1 shrink-0"
              title="Click to choose date"
            >
              <span>Pick</span>
              <ChevronRight className="w-3 h-3 text-blue-500" />
            </button>
          </div>
        </div>

        {/* Divider & Time Picker Section (when showTime is true) */}
        {showTime && (
          <>
            {/* Desktop Vertical Divider / Mobile Horizontal Divider */}
            <div className="hidden sm:block w-px h-8 bg-slate-200 shrink-0" />
            <div className="block sm:hidden h-px w-full bg-slate-100" />

            {/* Time Selector */}
            <div className="flex items-center justify-between sm:justify-start gap-2.5 px-3.5 py-2 sm:py-2 bg-slate-50/60 sm:bg-transparent rounded-b-2xl sm:rounded-none shrink-0">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 shrink-0">{timeLabel}:</span>
              </div>
              <input
                type="time"
                disabled={disabled}
                value={effectiveTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="text-sm font-bold font-mono text-slate-800 bg-white sm:bg-slate-50/80 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              />
            </div>
          </>
        )}
      </div>

      {/* Preset Quick Select Pills */}
      {presets && presets.length > 0 && !disabled && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1 mr-0.5 select-none">
            <Clock className="w-3 h-3 text-slate-400" />
            Quick:
          </span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(p)}
              className="px-2.5 py-1 rounded-lg bg-slate-100/90 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200/80 text-slate-600 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xs"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

