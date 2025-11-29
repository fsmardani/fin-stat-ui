'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { FILE_UPLOAD_CONFIG } from '@/lib/constants';

interface FileUploadProps {
    onFileSelect: (file: File | null) => void;
    acceptedTypes: string[];
    maxFileSize?: number;
    className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
    onFileSelect,
    acceptedTypes,
    maxFileSize = FILE_UPLOAD_CONFIG.maxFileSize,
    className
}) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string>('');

    const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
        setError('');

        if (rejectedFiles.length > 0) {
            const rejection = rejectedFiles[0];
            if (rejection.errors[0]?.code === 'file-too-large') {
                setError('فایل انتخاب شده خیلی بزرگ است');
            } else if (rejection.errors[0]?.code === 'file-invalid-type') {
                setError(`نوع فایل باید یکی از موارد زیر باشد: ${acceptedTypes.join(', ')}`);
            } else {
                setError('فایل نامعتبر انتخاب شده است');
            }
            return;
        }

        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            setSelectedFile(file);
            onFileSelect(file);
        }
    }, [onFileSelect, acceptedTypes, maxFileSize]);

    // Map file extensions to MIME types
    const getMimeType = (ext: string): string => {
        const mimeMap: Record<string, string> = {
            '.pdf': 'application/pdf',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.xls': 'application/vnd.ms-excel',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.doc': 'application/msword'
        };
        return mimeMap[ext.toLowerCase()] || '';
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: acceptedTypes.reduce((acc, type) => {
            const mimeType = getMimeType(type);
            if (mimeType) {
                acc[mimeType] = [];
            }
            return acc;
        }, {} as Record<string, string[]>),
        maxSize: maxFileSize,
        multiple: false
    });

    const removeFile = () => {
        const wasFileSelected = selectedFile !== null;
        setSelectedFile(null);
        setError('');
        // Notify parent that file was removed
        if (wasFileSelected) {
            onFileSelect(null);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className={className}>
            {!selectedFile ? (
                <div
                    {...getRootProps()}
                    className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${error ? 'border-red-300 bg-red-50' : ''}
          `}
                >
                    <input {...getInputProps()} />
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2 text-rtl">
                        {isDragActive ? 'فایل را اینجا رها کنید' : 'آپلود فایل'}
                    </p>
                    <p className="text-sm text-gray-500 mb-4 text-rtl">
                        فایل خود را اینجا بکشید و رها کنید، یا کلیک کنید تا انتخاب کنید
                    </p>
                    <p className="text-xs text-gray-400 text-rtl">
                        فرمت‌های قابل قبول: {acceptedTypes.join(', ')}
                    </p>
                </div>
            ) : (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-rtl-3">
                            <File className="h-8 w-8 text-blue-500" />
                            <div>
                                <p className="text-sm font-medium text-gray-900 text-rtl">{selectedFile.name}</p>
                                <p className="text-xs text-gray-500 text-rtl">{formatFileSize(selectedFile.size)}</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={removeFile}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {error && (
                <div className="mt-3 flex items-center space-x-rtl-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <p className="text-sm text-rtl">{error}</p>
                </div>
            )}
        </div>
    );
};
