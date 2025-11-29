'use client';

import React, { useState, useEffect } from 'react';
import { File, Download, Eye, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';

interface FilePreviewerProps {
    file?: File | null;
    analysisResult?: any;
    className?: string;
}

export const FilePreviewer: React.FC<FilePreviewerProps> = ({
    file,
    analysisResult,
    className
}) => {
    const [previewContent, setPreviewContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [excelSheets, setExcelSheets] = useState<string[]>([]);
    const [currentSheet, setCurrentSheet] = useState<string>('');
    const [excelWorkbook, setExcelWorkbook] = useState<any>(null);

    useEffect(() => {
        if (file) {
            generatePreview(file);
        } else {
            setPreviewContent('');
            setError('');
            setExcelSheets([]);
            setCurrentSheet('');
            setExcelWorkbook(null);
        }
    }, [file]);

    const generatePreview = async (file: File) => {
        setIsLoading(true);
        setError('');

        try {
            const fileType = file.type;
            const fileName = file.name.toLowerCase();

            if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
                await previewPDF(file);
            } else if (
                fileType.includes('spreadsheet') ||
                fileName.endsWith('.xlsx') ||
                fileName.endsWith('.xls')
            ) {
                await previewExcel(file);
            } else if (fileType.includes('text') || fileName.endsWith('.txt')) {
                await previewText(file);
            } else {
                setPreviewContent('پیش‌نمایش برای این نوع فایل در دسترس نیست');
            }
        } catch (err) {
            setError('تولید پیش‌نمایش با خطا مواجه شد');
            console.error('Preview error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const previewPDF = async (file: File) => {
        try {
            // Use simple iframe approach since it's working
            const fileUrl = URL.createObjectURL(file);

            setPreviewContent(`<div style="margin-bottom: 15px; font-weight: bold; color: #333; text-align: center;">پیش‌نمایش PDF: ${file.name}</div><div style="text-align: center; margin-bottom: 10px; font-size: 12px; color: #666;">اندازه فایل: ${(file.size / 1024 / 1024).toFixed(2)} مگابایت • آخرین تغییر: ${new Date(file.lastModified).toLocaleDateString()}</div><div style="border: 1px solid #ddd; border-radius: 4px; overflow: hidden;"><iframe src="${fileUrl}" style="width: 100%; height: 500px; border: none;" title="PDF Preview" onload="console.log('PDF loaded successfully')" onerror="console.log('PDF failed to load')"></iframe></div>`);

            // Clean up the URL after a delay
            setTimeout(() => URL.revokeObjectURL(fileUrl), 30000);

        } catch (error) {
            console.error('PDF preview error:', error);

            // Final fallback - just show file info
            setPreviewContent(`<div style="text-align: center; padding: 20px; color: #333;"><div style="font-weight: bold; margin-bottom: 15px; font-size: 16px;">📄 فایل PDF: ${file.name}</div><div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border: 2px dashed #dee2e6;"><div style="font-size: 14px; margin-bottom: 10px; color: #28a745;">✅ فایل آماده تحلیل است</div><div style="font-size: 12px; color: #666; line-height: 1.6;"><div>اندازه فایل: ${(file.size / 1024 / 1024).toFixed(2)} مگابایت</div><div>آخرین تغییر: ${new Date(file.lastModified).toLocaleDateString()}</div></div></div><div style="margin-top: 15px; font-size: 11px; color: #999;">برای مشاهده کامل فایل، از دکمه دانلود استفاده کنید</div></div>`);
        }
    };

    const previewExcel = async (file: File) => {
        try {
            // Import xlsx dynamically to avoid SSR issues
            const XLSX = await import('xlsx');

            // Read file as array buffer
            const arrayBuffer = await file.arrayBuffer();

            // Parse workbook
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });

            // Store workbook and sheet names
            setExcelWorkbook(workbook);
            setExcelSheets(workbook.SheetNames);

            // Set first sheet as current
            const firstSheetName = workbook.SheetNames[0];
            setCurrentSheet(firstSheetName);

            // Generate preview for first sheet
            await generateSheetPreview(workbook, firstSheetName, file);

        } catch (error) {
            console.error('Excel preview error:', error);
            setPreviewContent(`<div style="text-align: center; padding: 20px; color: #666;"><p>خطا در نمایش Excel: ${file.name}</p><p>اندازه فایل: ${(file.size / 1024 / 1024).toFixed(2)} مگابایت</p><p>آخرین تغییر: ${new Date(file.lastModified).toLocaleDateString()}</p></div>`);
        }
    };

    const generateSheetPreview = async (workbook: any, sheetName: string, file: File) => {
        try {
            // Import xlsx dynamically
            const XLSX = await import('xlsx');

            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            // Create HTML table (sheet selector is handled by React component)
            let tableHtml = `<div style="margin-bottom: 10px; font-weight: bold; color: #333;">پیش‌نمایش Excel: ${file.name}</div>
                <div style="overflow-x: auto; max-height: 400px; border: 1px solid #ddd; border-radius: 4px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">`;

            // Add table rows (limit to first 20 rows for performance)
            const maxRows = Math.min(20, jsonData.length);
            for (let i = 0; i < maxRows; i++) {
                const row = jsonData[i] as any[];
                tableHtml += '<tr>';

                // Add cells (limit to first 10 columns)
                const maxCols = Math.min(10, row.length);
                for (let j = 0; j < maxCols; j++) {
                    const cellValue = row[j] || '';
                    const cellStyle = i === 0 ? 'background-color: #f5f5f5; font-weight: bold;' : '';
                    tableHtml += `<td style="border: 1px solid #ddd; padding: 4px; ${cellStyle}">${cellValue}</td>`;
                }
                tableHtml += '</tr>';
            }

            tableHtml += `</table></div><div style="margin-top: 10px; font-size: 11px; color: #666;">
                برگه: ${sheetName} • نمایش ${maxRows} از ${jsonData.length} ردیف • اندازه فایل: ${(file.size / 1024 / 1024).toFixed(2)} مگابایت
            </div>`;

            setPreviewContent(tableHtml);

        } catch (error) {
            console.error('Sheet preview error:', error);
            setPreviewContent(`<div style="text-align: center; padding: 20px; color: #666;"><p>خطا در نمایش برگه: ${sheetName}</p></div>`);
        }
    };

    const previewText = async (file: File) => {
        const text = await file.text();
        setPreviewContent(text.substring(0, 1000) + (text.length > 1000 ? '...' : ''));
    };

    const downloadFile = () => {
        if (file) {
            const url = URL.createObjectURL(file);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    const switchSheet = async (sheetName: string) => {
        if (excelWorkbook && file) {
            setCurrentSheet(sheetName);
            await generateSheetPreview(excelWorkbook, sheetName, file);
        }
    };


    if (!file && !analysisResult) {
        return (
            <div className={`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center ${className}`}>
                <Eye className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 text-rtl">هیچ فایلی برای پیش‌نمایش انتخاب نشده است</p>
            </div>
        );
    }

    return (
        <div className={`border border-gray-200 rounded-lg ${className}`}>
            <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <File className="h-5 w-5 text-gray-500" />
                        <h3 className="text-sm font-medium text-gray-900 text-rtl">
                            {file ? file.name : 'نتیجه تحلیل'}
                        </h3>
                    </div>
                    {file && (
                        <Button variant="ghost" size="sm" onClick={downloadFile}>
                            <Download className="h-4 w-4 ml-1" />
                            دانلود
                        </Button>
                    )}
                </div>
            </div>

            <div className="p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="mr-2 text-gray-600 text-rtl">در حال تولید پیش‌نمایش...</span>
                    </div>
                ) : error ? (
                    <div className="flex items-center space-x-rtl-2 text-red-600 py-4">
                        <AlertCircle className="h-5 w-5" />
                        <p className="text-rtl">{error}</p>
                    </div>
                ) : analysisResult ? (
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2 text-rtl">خلاصه تحلیل</h4>
                            <p className="text-sm text-gray-700 text-rtl">{analysisResult.summary}</p>
                        </div>
                        {analysisResult.insights && analysisResult.insights.length > 0 && (
                            <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-2 text-rtl">بینش‌های کلیدی</h4>
                                <ul className="list-disc list-inside space-y-1 text-rtl">
                                    {analysisResult.insights.map((insight: string, index: number) => (
                                        <li key={index} className="text-sm text-gray-700">{insight}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2 text-rtl">امتیاز اطمینان</h4>
                            <div className="flex items-center space-x-rtl-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full"
                                        style={{ width: `${analysisResult.confidence}%` }}
                                    ></div>
                                </div>
                                <span className="text-sm text-gray-600">{analysisResult.confidence}%</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-50 rounded-md p-4">
                        {/* Excel Sheet Selector */}
                        {excelSheets.length > 1 && (
                            <div className="mb-4 p-3 bg-white rounded border">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-medium text-gray-700 text-rtl">انتخاب برگه:</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {excelSheets.map((sheetName) => (
                                        <button
                                            key={sheetName}
                                            onClick={() => switchSheet(sheetName)}
                                            className={`px-3 py-1 text-xs rounded border transition-colors ${sheetName === currentSheet
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            {sheetName}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {previewContent.startsWith('<') ? (
                            <div
                                className="text-sm text-gray-700"
                                dangerouslySetInnerHTML={{ __html: previewContent }}
                            />
                        ) : (
                            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                                {previewContent}
                            </pre>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
