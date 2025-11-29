import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    className,
    id,
    ...props
}) => {
    const generatedId = React.useId();
    const inputId = id || `input-${generatedId}`;

    return (
        <div className="space-y-1">
            {label && (
                <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 text-rtl">
                    {label}
                </label>
            )}
            <input
                id={inputId}
                className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-rtl px-3 py-2 leading-5 ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                    } ${className || ''}`}
                {...props}
            />
            {error && (
                <p className="text-sm text-red-600 text-rtl">{error}</p>
            )}
        </div>
    );
};
