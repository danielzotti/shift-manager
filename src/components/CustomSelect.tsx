import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  color?: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
  customTrigger?: (selectedOption?: SelectOption, isOpen?: boolean) => React.ReactNode;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = '',
  className = '',
  buttonClassName,
  disabled = false,
  customTrigger,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openDirection, setOpenDirection] = useState<'down' | 'up'>('down');
  const [horizontalAlign, setHorizontalAlign] = useState<'left' | 'right'>('left');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const toggleOpen = () => {
    if (!disabled) {
      if (!isOpen && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const spaceRight = window.innerWidth - rect.left;
        const spaceLeft = rect.right;

        // Vertical positioning
        if (spaceBelow < 250 && spaceAbove > spaceBelow) {
          setOpenDirection('up');
        } else {
          setOpenDirection('down');
        }

        // Horizontal alignment (align right if button is near right edge of screen)
        if (spaceRight < 220 && spaceLeft > spaceRight) {
          setHorizontalAlign('right');
        } else {
          setHorizontalAlign('left');
        }
      }
      setIsOpen(!isOpen);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const defaultButtonClass = `w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 flex items-center justify-between gap-2 transition ${
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-slate-700'
  }`;

  return (
    <div className={`relative ${isOpen ? 'z-50' : 'z-0'} ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
        className={buttonClassName !== undefined ? buttonClassName : defaultButtonClass}
      >
        {customTrigger ? (
          customTrigger(selectedOption, isOpen)
        ) : (
          <>
            <div className="flex items-center gap-2 min-w-0 truncate">
              {selectedOption?.color && (
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: selectedOption.color }}
                />
              )}
              <span className="truncate">
                {selectedOption ? selectedOption.label : placeholder || options[0]?.label || ''}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </>
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl min-w-full w-max max-w-[220px] sm:max-w-[280px] overflow-y-auto py-1 text-sm text-slate-200 animate-in fade-in zoom-in-95 duration-100 ${
            openDirection === 'up' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } ${
            horizontalAlign === 'right' ? 'right-0 left-auto' : 'left-0 right-auto'
          }`}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(opt.value);
                }}
                className={`px-3 py-2 cursor-pointer flex items-center justify-between gap-3 hover:bg-slate-800 transition text-xs sm:text-sm ${
                  isSelected ? 'bg-cyan-950/50 text-cyan-400 font-semibold' : ''
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {opt.color ? (
                    <span
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0"
                      style={{ backgroundColor: opt.color }}
                    />
                  ) : (
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border border-slate-700 shrink-0" />
                  )}
                  <span className="truncate" title={opt.label}>{opt.label}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0 ml-2" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
