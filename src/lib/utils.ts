import { clsx } from 'clsx';

// Utility function to generate stable IDs for SSR
let idCounter = 0;
export const generateId = (prefix: string = 'id') => {
    // Use a more stable approach that works better with SSR
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

// Utility function to combine class names
export const cn = (...inputs: any[]) => {
    return clsx(inputs);
};
