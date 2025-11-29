import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string; label: string; disabled?: boolean }[];
}

export const Select: React.FC<SelectProps> = ({
    label,
    error,
    options,
    className,
    id,
    ...props
}) => {
    const generatedId = React.useId();
    const selectId = id || `select-${generatedId}`;

    return (
        <div className="space-y-1">
            {label && (
                <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 text-rtl">
                    {label}
                </label>
            )}
            <select
                id={selectId}
                className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-rtl px-3 py-2 leading-5 text-gray-900 bg-white ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                    } ${className || ''}`}
                {...props}
            >
                <option value="" className="text-gray-900">انتخاب کنید...</option>
                {options.map((option) => (
                    <option 
                        key={option.value} 
                        value={option.value} 
                        disabled={option.disabled}
                        className={`text-gray-900 ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {option.label}
                    </option>
                ))}
            </select>
            {error && (
                <p className="text-sm text-red-600 text-rtl">{error}</p>
            )}
        </div>
    );
};
