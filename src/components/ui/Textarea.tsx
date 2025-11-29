import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
    label,
    error,
    className,
    id,
    ...props
}) => {
    const generatedId = React.useId();
    const textareaId = id || `textarea-${generatedId}`;

    return (
        <div className="space-y-1">
            {label && (
                <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700 text-rtl">
                    {label}
                </label>
            )}
            <textarea
                id={textareaId}
                className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-rtl ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                    } ${className || ''}`}
                {...props}
            />
            {error && (
                <p className="text-sm text-red-600 text-rtl">{error}</p>
            )}
        </div>
    );
};
