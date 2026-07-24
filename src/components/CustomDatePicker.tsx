import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CustomDatePickerProps {
  value: string; // 'YYYY-MM-DD'
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  className = '',
  disabled = false,
  placeholder = '',
}) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [openDirection, setOpenDirection] = useState<'down' | 'up'>('down');
  const [horizontalAlign, setHorizontalAlign] = useState<'left' | 'right'>('left');
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse YYYY-MM-DD
  const parseDate = (str: string) => {
    if (!str) return null;
    const parts = str.split('-').map(Number);
    if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
  };

  const selectedDate = parseDate(value);
  const today = new Date();

  // Navigation view state (Month/Year)
  const [viewYear, setViewYear] = useState<number>(selectedDate ? selectedDate.getFullYear() : today.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(selectedDate ? selectedDate.getMonth() : today.getMonth());

  useEffect(() => {
    if (selectedDate) {
      setViewYear(selectedDate.getFullYear());
      setViewMonth(selectedDate.getMonth());
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOpen = () => {
    if (!disabled) {
      if (!isOpen && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const spaceRight = window.innerWidth - rect.left;
        const spaceLeft = rect.right;

        if (spaceBelow < 320 && spaceAbove > spaceBelow) {
          setOpenDirection('up');
        } else {
          setOpenDirection('down');
        }

        if (spaceRight < 300 && spaceLeft > spaceRight) {
          setHorizontalAlign('right');
        } else {
          setHorizontalAlign('left');
        }
      }
      setIsOpen(!isOpen);
    }
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (dayNum: number) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(dayNum).padStart(2, '0');
    const dateStr = `${viewYear}-${mm}-${dd}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const lang = i18n.language || 'it';

  // Format header (Month Year)
  const headerDate = new Date(viewYear, viewMonth, 1);
  const monthYearLabel = headerDate.toLocaleDateString(lang, { month: 'long', year: 'numeric' });
  const capitalizedHeader = monthYearLabel.charAt(0).toUpperCase() + monthYearLabel.slice(1);

  // Formatted value display
  const displayValue = selectedDate
    ? selectedDate.toLocaleDateString(lang, { day: '2-digit', month: '2-digit', year: 'numeric' })
    : placeholder;

  // Calendar calculations
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sun
  // Adjust so Monday is 0 (Mo:0, Tu:1, We:2, Th:3, Fr:4, Sa:5, Su:6)
  const startingOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const weekDayLabels = lang.startsWith('it')
    ? ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className={`relative ${isOpen ? 'z-50' : 'z-0'} ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
        className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 flex items-center justify-between gap-2 transition ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-slate-700'
        }`}
      >
        <span className={selectedDate ? 'text-white font-medium' : 'text-slate-500'}>
          {displayValue}
        </span>
        <CalendarIcon className="w-4 h-4 text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-4 w-72 text-slate-200 animate-in fade-in zoom-in-95 duration-100 ${
            openDirection === 'up' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } ${
            horizontalAlign === 'right' ? 'right-0 left-auto' : 'left-0 right-auto'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-white text-sm">{capitalizedHeader}</span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {weekDayLabels.map((wd) => (
              <span key={wd} className="text-[11px] font-bold text-slate-500 py-1">
                {wd}
              </span>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Empty slots for starting offset */}
            {Array.from({ length: startingOffset }).map((_, idx) => (
              <div key={`empty-${idx}`} />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const isSelected =
                selectedDate &&
                selectedDate.getFullYear() === viewYear &&
                selectedDate.getMonth() === viewMonth &&
                selectedDate.getDate() === dayNum;

              const isToday =
                today.getFullYear() === viewYear &&
                today.getMonth() === viewMonth &&
                today.getDate() === dayNum;

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={`h-8 text-xs font-semibold rounded-lg flex items-center justify-center transition ${
                    isSelected
                      ? 'bg-cyan-500 text-white font-bold shadow-md shadow-cyan-500/30'
                      : isToday
                      ? 'border border-cyan-500/60 text-cyan-400 hover:bg-slate-800'
                      : 'hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
