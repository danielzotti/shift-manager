import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CustomMonthPickerProps {
  value: string; // 'YYYY-MM'
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export const CustomMonthPicker: React.FC<CustomMonthPickerProps> = ({
  value,
  onChange,
  className = '',
  disabled = false,
}) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [openDirection, setOpenDirection] = useState<'down' | 'up'>('down');
  const [horizontalAlign, setHorizontalAlign] = useState<'left' | 'right'>('left');
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial YYYY-MM
  const parseValue = (val: string) => {
    const parts = val.split('-');
    const year = parts[0] ? parseInt(parts[0], 10) : new Date().getFullYear();
    const month = parts[1] ? parseInt(parts[1], 10) - 1 : new Date().getMonth();
    return { year, month };
  };

  const { year: currentYear, month: currentMonth } = parseValue(value || '');
  const [navYear, setNavYear] = useState<number>(currentYear);

  useEffect(() => {
    setNavYear(currentYear);
  }, [currentYear]);

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

        if (spaceBelow < 260 && spaceAbove > spaceBelow) {
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

  const getMonthName = (mIndex: number, yearNum: number, short = false) => {
    const date = new Date(yearNum, mIndex, 1);
    const lang = i18n.language || 'it';
    const name = date.toLocaleDateString(lang, { month: short ? 'short' : 'long' });
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const handleSelectMonth = (mIndex: number) => {
    const mm = String(mIndex + 1).padStart(2, '0');
    const val = `${navYear}-${mm}`;
    onChange(val);
    setIsOpen(false);
  };

  const formattedDisplay = `${getMonthName(currentMonth, currentYear, false)} ${currentYear}`;

  return (
    <div className={`relative ${isOpen ? 'z-50' : 'z-0'} ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
        className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 flex items-center justify-between gap-2 transition ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-slate-700'
        }`}
      >
        <span className="truncate">{formattedDisplay}</span>
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
          {/* Year Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setNavYear((y) => y - 1)}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-white text-base">{navYear}</span>
            <button
              type="button"
              onClick={() => setNavYear((y) => y + 1)}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 12 }).map((_, idx) => {
              const isSelected = navYear === currentYear && idx === currentMonth;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectMonth(idx)}
                  className={`py-2 px-1 text-xs font-semibold rounded-xl transition ${
                    isSelected
                      ? 'bg-cyan-500 text-white font-bold shadow-lg shadow-cyan-500/20'
                      : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  {getMonthName(idx, navYear, true)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
