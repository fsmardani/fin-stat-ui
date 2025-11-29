'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import moment from 'moment-jalaali';

type MomentType = ReturnType<typeof moment>;

interface PersianDatePickerProps {
    value?: string;
    onChange: (date: string) => void;
    placeholder?: string;
    className?: string;
    id?: string;
}

const PersianDatePicker: React.FC<PersianDatePickerProps> = ({
    value,
    onChange,
    placeholder = 'تاریخ را انتخاب کنید',
    className = '',
    id
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(moment());
    const [selectedDate, setSelectedDate] = useState<string>(value || '');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const generatedId = React.useId();
    const inputId = id || `persian-date-${generatedId}`;

    useEffect(() => {
        if (value) {
            setSelectedDate(value);
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatDate = (date: MomentType) => {
        return date.format('jYYYY/jMM/jDD');
    };

    const getMonthDays = () => {
        const startOfMonth = currentMonth.clone().startOf('jMonth');
        const endOfMonth = currentMonth.clone().endOf('jMonth');
        const days = [];

        // Add empty cells for days before the first day of the month
        const firstDayOfWeek = startOfMonth.day();
        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let day = 1; day <= endOfMonth.jDate(); day++) {
            const date = startOfMonth.clone().jDate(day);
            days.push(date);
        }

        return days;
    };

    const handleDateSelect = (date: MomentType) => {
        const formattedDate = formatDate(date);
        setSelectedDate(formattedDate);
        onChange(formattedDate);
        setIsOpen(false);
    };

    const handlePrevMonth = () => {
        setCurrentMonth(currentMonth.clone().subtract(1, 'jMonth'));
    };

    const handleNextMonth = () => {
        setCurrentMonth(currentMonth.clone().add(1, 'jMonth'));
    };

    const isToday = (date: MomentType) => {
        return date.format('jYYYY/jMM/jDD') === moment().format('jYYYY/jMM/jDD');
    };

    const isSelected = (date: MomentType) => {
        return date.format('jYYYY/jMM/jDD') === selectedDate;
    };

    const monthNames = [
        'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
        'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ];

    const dayNames = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <div className="relative">
                <input
                    id={inputId}
                    type="text"
                    value={selectedDate}
                    placeholder={placeholder}
                    readOnly
                    onClick={() => setIsOpen(!isOpen)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-rtl pr-10 pl-3 py-2 text-sm leading-5"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-gray-400" />
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
                    <div className="p-3">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                            <button
                                onClick={handlePrevMonth}
                                className="p-1 hover:bg-gray-100 rounded"
                                type="button"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                            <div className="text-sm font-medium text-gray-900">
                                {monthNames[currentMonth.jMonth()]} {currentMonth.jYear()}
                            </div>
                            <button
                                onClick={handleNextMonth}
                                className="p-1 hover:bg-gray-100 rounded"
                                type="button"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Day names */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {dayNames.map((day) => (
                                <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {getMonthDays().map((date, index) => {
                                if (!date) {
                                    return <div key={index} className="h-8" />;
                                }

                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleDateSelect(date)}
                                        className={`
                      h-8 text-xs rounded hover:bg-blue-100
                      ${isToday(date) ? 'bg-blue-50 text-blue-600 font-medium' : ''}
                      ${isSelected(date) ? 'bg-blue-600 text-white' : 'text-gray-700'}
                      ${!isSelected(date) && !isToday(date) ? 'hover:bg-gray-100' : ''}
                    `}
                                        type="button"
                                    >
                                        {date.jDate()}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="mt-3 pt-2 border-t border-gray-200 flex justify-between">
                            <button
                                onClick={() => {
                                    const today = moment();
                                    handleDateSelect(today);
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800"
                                type="button"
                            >
                                امروز
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedDate('');
                                    onChange('');
                                    setIsOpen(false);
                                }}
                                className="text-xs text-gray-500 hover:text-gray-700"
                                type="button"
                            >
                                پاک کردن
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PersianDatePicker;
