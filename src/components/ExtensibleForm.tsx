'use client';

import React, { useState, useEffect } from 'react';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Textarea } from './ui/Textarea';
import { FormField } from '@/types';

interface ExtensibleFormProps {
    fields: FormField[];
    initialData?: Record<string, any>;
    onChange: (data: Record<string, any>) => void;
    className?: string;
}

export const ExtensibleForm: React.FC<ExtensibleFormProps> = ({
    fields,
    initialData = {},
    onChange,
    className
}) => {
    const [formData, setFormData] = useState<Record<string, any>>(initialData);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        onChange(formData);
    }, [formData, onChange]);

    const handleInputChange = (fieldId: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [fieldId]: value
        }));

        // Clear error when user starts typing
        if (errors[fieldId]) {
            setErrors(prev => ({
                ...prev,
                [fieldId]: ''
            }));
        }
    };

    const validateField = (field: FormField, value: any): string => {
        if (field.required && (!value || value.toString().trim() === '')) {
            return `${field.label} is required`;
        }

        if (field.type === 'number' && value && isNaN(Number(value))) {
            return `${field.label} must be a valid number`;
        }

        if (field.type === 'date' && value) {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                return `${field.label} must be a valid date`;
            }
        }

        return '';
    };

    const handleBlur = (field: FormField) => {
        const value = formData[field.id];
        const error = validateField(field, value);

        if (error) {
            setErrors(prev => ({
                ...prev,
                [field.id]: error
            }));
        }
    };

    const renderField = (field: FormField) => {
        const value = formData[field.id] || '';
        const error = errors[field.id];

        switch (field.type) {
            case 'text':
                return (
                    <Input
                        key={field.id}
                        id={field.id}
                        label={field.label}
                        value={value}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        onBlur={() => handleBlur(field)}
                        placeholder={field.placeholder}
                        error={error}
                        required={field.required}
                    />
                );

            case 'number':
                return (
                    <Input
                        key={field.id}
                        id={field.id}
                        type="number"
                        label={field.label}
                        value={value}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        onBlur={() => handleBlur(field)}
                        placeholder={field.placeholder}
                        error={error}
                        required={field.required}
                    />
                );

            case 'date':
                return (
                    <Input
                        key={field.id}
                        id={field.id}
                        type="date"
                        label={field.label}
                        value={value}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        onBlur={() => handleBlur(field)}
                        error={error}
                        required={field.required}
                    />
                );

            case 'select':
                return (
                    <Select
                        key={field.id}
                        id={field.id}
                        label={field.label}
                        value={value}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        onBlur={() => handleBlur(field)}
                        error={error}
                        required={field.required}
                        options={field.options?.map(option => ({
                            value: option,
                            label: option
                        })) || []}
                    />
                );

            case 'textarea':
                return (
                    <Textarea
                        key={field.id}
                        id={field.id}
                        label={field.label}
                        value={value}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        onBlur={() => handleBlur(field)}
                        placeholder={field.placeholder}
                        error={error}
                        required={field.required}
                        rows={4}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div className={`space-y-3 ${className}`}>
            {fields.map(renderField)}
        </div>
    );
};
