'use client';

import React, { useState } from 'react';
import { FileUpload } from './FileUpload';
import { ExtensibleForm } from './ExtensibleForm';
import { FilePreviewer } from './FilePreviewer';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { UploadedFile, Company, ReportType, FormField } from '@/types';
import { AnalysisEngine } from '@/lib/analysisEngine';
import { apiClient } from '@/lib/api';
import { Upload, FileText, BarChart3 } from 'lucide-react';

interface ReportUploadFormProps {
    companies: Company[];
    reportTypes: ReportType[];
    onFileUploaded: (file: UploadedFile) => void;
    className?: string;
}

export const ReportUploadForm: React.FC<ReportUploadFormProps> = ({
    companies,
    reportTypes,
    onFileUploaded,
    className
}) => {
    const [selectedCompany, setSelectedCompany] = useState('');
    const [selectedReportType, setSelectedReportType] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<{
        financialStatement: File | null;
        expenses: File | null;
        budget: File | null;
    }>({
        financialStatement: null,
        expenses: null,
        budget: null
    });
    // Multi-year support for type1
    const [numberOfYears, setNumberOfYears] = useState<number>(1);
    const [years, setYears] = useState<string[]>(['']);
    const [yearFiles, setYearFiles] = useState<Record<string, {
        financialStatement: File | null;
        expenses: File | null;
        budget: File | null;
    }>>({});
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [currentStep, setCurrentStep] = useState<'upload' | 'form' | 'preview' | 'analysis'>('upload');
    const [error, setError] = useState<string>('');
    const [uploadResetKey, setUploadResetKey] = useState(0);
    const [uploadedFilesList, setUploadedFilesList] = useState<UploadedFile[]>([]);

    const currentReportType = reportTypes.find(rt => rt.id === selectedReportType);

    const handleFileSelect = (file: File | null, fileType: 'financialStatement' | 'expenses' | 'budget') => {
        setSelectedFiles(prev => ({
            ...prev,
            [fileType]: file
        }));
    };

    const handleRemoveFile = (fileType: 'financialStatement' | 'expenses' | 'budget') => {
        setSelectedFiles(prev => ({
            ...prev,
            [fileType]: null
        }));
    };

    // Multi-year handlers for type1
    const handleNumberOfYearsChange = (value: number) => {
        const num = Math.max(1, Math.min(10, value)); // Limit between 1 and 10
        setNumberOfYears(num);

        // Initialize years array
        const newYears = Array(num).fill('').map((_, index) =>
            years[index] || ''
        );
        setYears(newYears);

        // Initialize yearFiles for new years
        const newYearFiles = { ...yearFiles };
        newYears.forEach(year => {
            if (year && !newYearFiles[year]) {
                newYearFiles[year] = {
                    financialStatement: null,
                    expenses: null,
                    budget: null
                };
            }
        });
        // Remove files for years that are no longer in the list
        Object.keys(newYearFiles).forEach(year => {
            if (!newYears.includes(year)) {
                delete newYearFiles[year];
            }
        });
        setYearFiles(newYearFiles);
    };

    const handleYearNameChange = (index: number, yearName: string) => {
        const oldYear = years[index];
        const newYears = [...years];
        newYears[index] = yearName;
        setYears(newYears);

        // Update yearFiles mapping
        setYearFiles(prev => {
            const newYearFiles = { ...prev };

            // If old year exists, move its files to new year name
            if (oldYear && newYearFiles[oldYear]) {
                const files = newYearFiles[oldYear];
                delete newYearFiles[oldYear];
                if (yearName) {
                    newYearFiles[yearName] = files;
                }
            } else if (yearName && !newYearFiles[yearName]) {
                // Initialize new year if it doesn't exist
                newYearFiles[yearName] = {
                    financialStatement: null,
                    expenses: null,
                    budget: null
                };
            }

            return newYearFiles;
        });
    };

    const handleYearFileSelect = (year: string, file: File | null, fileType: 'financialStatement' | 'expenses' | 'budget') => {
        if (!year) return;
        setYearFiles(prev => ({
            ...prev,
            [year]: {
                ...(prev[year] || {
                    financialStatement: null,
                    expenses: null,
                    budget: null
                }),
                [fileType]: file
            }
        }));
    };

    const handleRemoveYearFile = (year: string, fileType: 'financialStatement' | 'expenses' | 'budget') => {
        if (!year || !yearFiles[year]) return;
        setYearFiles(prev => ({
            ...prev,
            [year]: {
                ...prev[year],
                [fileType]: null
            }
        }));
    };

    const handleFormChange = (data: Record<string, any>) => {
        setFormData(data);
    };

    const handleAnalyze = async () => {
        if (!selectedCompany || !selectedReportType) return;

        // For type1, check if we have files for at least one year
        if (selectedReportType === '1') {
            const hasAnyYearFiles = years.some(year =>
                year && yearFiles[year] && yearFiles[year].financialStatement
            );
            if (!hasAnyYearFiles) {
                setError('لطفاً حداقل برای یک سال فایل صورت مالی را آپلود کنید.');
                return;
            }
        } else if (!selectedFiles.financialStatement) {
            return;
        }

        setIsUploading(true);
        setError('');
        setCurrentStep('analysis');

        try {
            const uploadedFiles: UploadedFile[] = [];

            // For report type 2 (Audit Report), upload only the single Excel file
            if (selectedReportType === '2') {
                const financialStatementFile = selectedFiles.financialStatement;
                if (!financialStatementFile) {
                    throw new Error('فایل صورت مالی انتخاب نشده است');
                }

                const uploadResponse = await apiClient.uploadFile(
                    financialStatementFile,
                    selectedCompany,
                    selectedReportType,
                    formData
                );

                if (!uploadResponse.success || !uploadResponse.data?.file) {
                    throw new Error(uploadResponse.message || 'File upload failed');
                }

                // Update status to processing after upload
                await apiClient.updateFileAnalysis(uploadResponse.data.file._id, 'processing');

                uploadedFiles.push({
                    id: uploadResponse.data.file._id,
                    fileName: uploadResponse.data.file.originalFileName,
                    fileType: uploadResponse.data.file.fileType,
                    fileSize: uploadResponse.data.file.fileSize,
                    companyId: uploadResponse.data.file.companyId,
                    reportTypeId: uploadResponse.data.file.reportTypeId,
                    uploadDate: new Date(uploadResponse.data.file.uploadDate),
                    analysisStatus: 'processing',
                    analysisResult: undefined,
                    formData: uploadResponse.data.file.formData || formData
                });
            } else if (selectedReportType === '1') {
                // For report type 1, upload files for each year
                for (const year of years) {
                    if (!year || !yearFiles[year]) continue;

                    const yearFilePackage = yearFiles[year];
                    const filesToUpload = [
                        { file: yearFilePackage.financialStatement, type: 'صورت مالی' },
                        { file: yearFilePackage.expenses, type: 'هزینه ها' },
                        { file: yearFilePackage.budget, type: 'بودجه' }
                    ].filter(item => item.file !== null);

                    // Upload all files for this year
                    for (const { file, type } of filesToUpload) {
                        if (!file) continue;

                        const uploadResponse = await apiClient.uploadFile(
                            file,
                            selectedCompany,
                            selectedReportType,
                            { ...formData, year, fileType: type }
                        );

                        if (!uploadResponse.success || !uploadResponse.data?.file) {
                            throw new Error(uploadResponse.message || `File upload failed for year ${year}, ${type}`);
                        }

                        // Update status to processing after upload
                        await apiClient.updateFileAnalysis(uploadResponse.data.file._id, 'processing');

                        uploadedFiles.push({
                            id: uploadResponse.data.file._id,
                            fileName: uploadResponse.data.file.originalFileName,
                            fileType: uploadResponse.data.file.fileType,
                            fileSize: uploadResponse.data.file.fileSize,
                            companyId: uploadResponse.data.file.companyId,
                            reportTypeId: uploadResponse.data.file.reportTypeId,
                            uploadDate: new Date(uploadResponse.data.file.uploadDate),
                            analysisStatus: 'processing',
                            analysisResult: undefined,
                            formData: { ...(uploadResponse.data.file.formData || formData), year }
                        });
                    }
                }
            } else {
                // For other report types, upload multiple files (legacy behavior)
                const filesToUpload = [
                    { file: selectedFiles.financialStatement, type: 'صورت مالی' },
                    { file: selectedFiles.expenses, type: 'هزینه ها' },
                    { file: selectedFiles.budget, type: 'بودجه' }
                ].filter(item => item.file !== null);

                // Upload all files
                for (const { file, type } of filesToUpload) {
                    if (!file) continue;

                    const uploadResponse = await apiClient.uploadFile(
                        file,
                        selectedCompany,
                        selectedReportType,
                        { ...formData, fileType: type }
                    );

                    if (!uploadResponse.success || !uploadResponse.data?.file) {
                        throw new Error(uploadResponse.message || `File upload failed for ${type}`);
                    }

                    // Update status to processing after upload
                    await apiClient.updateFileAnalysis(uploadResponse.data.file._id, 'processing');

                    uploadedFiles.push({
                        id: uploadResponse.data.file._id,
                        fileName: uploadResponse.data.file.originalFileName,
                        fileType: uploadResponse.data.file.fileType,
                        fileSize: uploadResponse.data.file.fileSize,
                        companyId: uploadResponse.data.file.companyId,
                        reportTypeId: uploadResponse.data.file.reportTypeId,
                        uploadDate: new Date(uploadResponse.data.file.uploadDate),
                        analysisStatus: 'processing',
                        analysisResult: undefined,
                        formData: uploadResponse.data.file.formData || formData
                    });
                }
            }

            // After successful upload, keep status as processing
            setIsUploading(false);
            setIsAnalyzing(false);
            setUploadedFilesList(uploadedFiles);

            // Notify about uploaded files (status is processing)
            if (uploadedFiles[0]) {
                onFileUploaded(uploadedFiles[0]);
            }

            // Note: Analysis will be completed later by backend/background process
            // The status will be updated to 'completed' when processing is done
        } catch (error: any) {
            console.error('Upload failed:', error);
            setError(error.message || 'خطا در آپلود فایل. لطفاً دوباره تلاش کنید.');
            setCurrentStep('preview');
        } finally {
            setIsUploading(false);
            setIsAnalyzing(false);
        }
    };

    const resetForm = () => {
        setSelectedCompany('');
        setSelectedReportType('');
        setSelectedFiles({
            financialStatement: null,
            expenses: null,
            budget: null
        });
        setNumberOfYears(1);
        setYears(['']);
        setYearFiles({});
        setFormData({});
        setAnalysisResult(null);
        setCurrentStep('upload');
        setUploadResetKey(prev => prev + 1); // Force FileUpload components to reset
        setUploadedFilesList([]);
    };

    const canProceedToForm = selectedCompany && selectedReportType && !currentReportType?.disabled;

    // For type1, check if we have at least one year with financial statement
    const hasRequiredFilesForType1 = selectedReportType === '1'
        ? years.some(year => year && yearFiles[year]?.financialStatement)
        : selectedFiles.financialStatement;

    const canProceedToPreview = hasRequiredFilesForType1 && canProceedToForm &&
        currentReportType?.formFields.every(field => !field.required || formData[field.id]);
    const canProceedToAnalysis = hasRequiredFilesForType1 && canProceedToForm &&
        currentReportType?.formFields.every(field => !field.required || formData[field.id]);

    return (
        <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2 text-rtl">آپلود گزارش</h2>
                <p className="text-gray-600 text-rtl">آپلود و تحلیل گزارش‌های مالی با هوش مصنوعی</p>
            </div>

            {/* Progress Steps */}
            <div className="mb-6">
                <div className="flex items-center justify-center space-x-rtl-8">
                    {[
                        { key: 'upload', label: 'آپلود', icon: Upload },
                        { key: 'form', label: 'جزئیات', icon: FileText },
                        { key: 'preview', label: 'پیش‌نمایش', icon: BarChart3 },
                        { key: 'analysis', label: 'تحلیل', icon: BarChart3 }
                    ].map((step, index) => {
                        const Icon = step.icon;
                        const isActive = currentStep === step.key;
                        const isCompleted = ['upload', 'form', 'preview', 'analysis'].indexOf(currentStep) > index;

                        return (
                            <div key={step.key} className="flex items-center">
                                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2
                  ${isActive ? 'border-blue-600 bg-blue-600 text-white' :
                                        isCompleted ? 'border-green-600 bg-green-600 text-white' :
                                            'border-gray-300 bg-white text-gray-500'}
                `}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <span className={`ml-2 text-sm font-medium text-rtl ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                                    }`}>
                                    {step.label}
                                </span>
                                {index < 3 && (
                                    <div className={`w-8 h-0.5 mx-2 ${isCompleted ? 'bg-green-600' : 'bg-gray-300'
                                        }`} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Step 1: Company and Report Type Selection */}
            {currentStep === 'upload' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            label="انتخاب شرکت"
                            value={selectedCompany}
                            onChange={(e) => setSelectedCompany(e.target.value)}
                            options={[
                                { value: '', label: 'شرکتی را انتخاب کنید...' },
                                ...companies.map(company => ({
                                    value: company.id,
                                    label: company.name
                                }))
                            ]}
                        />

                        <Select
                            label="نوع گزارش"
                            value={selectedReportType}
                            onChange={(e) => {
                                const selectedType = reportTypes.find(rt => rt.id === e.target.value);
                                if (selectedType && !selectedType.disabled) {
                                    setSelectedReportType(e.target.value);
                                }
                            }}
                            options={[
                                { value: '', label: 'نوع گزارش را انتخاب کنید...' },
                                ...reportTypes.map(type => ({
                                    value: type.id,
                                    label: type.name,
                                    disabled: type.disabled || false
                                }))
                            ]}
                        />
                    </div>

                    {canProceedToForm && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-medium text-gray-900 text-rtl">آپلود فایل‌ها</h3>

                            {/* For report type 2 (Audit Report), show single file upload */}
                            {selectedReportType === '2' ? (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-gray-700 text-rtl">
                                            فایل اکسل چند برگه‌ای <span className="text-red-500">*</span>
                                        </label>
                                    </div>
                                    <p className="text-xs text-gray-500 text-rtl mb-2">
                                        لطفاً فایل اکسل با چندین برگه را آپلود کنید
                                    </p>
                                    <FileUpload
                                        key={`audit-${uploadResetKey}`}
                                        onFileSelect={(file) => handleFileSelect(file, 'financialStatement')}
                                        acceptedTypes={currentReportType?.acceptedFileTypes || ['.xlsx', '.xls']}
                                    />
                                    {selectedFiles.financialStatement && (
                                        <div className="mt-4">
                                            <Button
                                                onClick={() => setCurrentStep('form')}
                                                className="w-full"
                                            >
                                                ادامه به مرحله بعد
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : selectedReportType === '1' ? (
                                <>
                                    {/* Multi-year configuration for type1 */}
                                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700 text-rtl">
                                                تعداد سال‌ها <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="10"
                                                value={numberOfYears}
                                                onChange={(e) => handleNumberOfYearsChange(parseInt(e.target.value) || 1)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-rtl text-gray-900 placeholder:text-gray-400"
                                                placeholder="تعداد سال‌ها (مثلاً 4)"
                                            />
                                        </div>

                                        {/* Year name inputs */}
                                        <div className="space-y-3">
                                            <label className="text-sm font-medium text-gray-700 text-rtl">
                                                نام سال‌ها <span className="text-red-500">*</span>
                                            </label>
                                            {years.map((year, index) => (
                                                <div key={index} className="space-y-2">
                                                    <input
                                                        type="text"
                                                        value={year}
                                                        onChange={(e) => handleYearNameChange(index, e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-rtl text-gray-900 placeholder:text-gray-400"
                                                        placeholder={`سال ${index + 1} (مثلاً 1400)`}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* File uploads for each year */}
                                    {years.filter(y => y).map((year, yearIndex) => (
                                        <div key={year} className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                            <h4 className="text-md font-semibold text-gray-900 text-rtl mb-3">
                                                فایل‌های سال {year}
                                            </h4>

                                            {/* صورت مالی - Mandatory */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-sm font-medium text-gray-700 text-rtl">
                                                        ۱. صورت مالی <span className="text-red-500">*</span>
                                                    </label>
                                                    {yearFiles[year]?.financialStatement && (
                                                        <button
                                                            onClick={() => handleRemoveYearFile(year, 'financialStatement')}
                                                            className="text-xs text-red-600 hover:text-red-800 text-rtl"
                                                        >
                                                            حذف
                                                        </button>
                                                    )}
                                                </div>
                                                <FileUpload
                                                    key={`financial-${year}-${uploadResetKey}`}
                                                    onFileSelect={(file) => handleYearFileSelect(year, file, 'financialStatement')}
                                                    acceptedTypes={currentReportType?.acceptedFileTypes || ['.pdf', '.xlsx']}
                                                />
                                                {yearFiles[year]?.financialStatement && (
                                                    <p className="text-xs text-green-600 text-rtl">
                                                        ✓ {yearFiles[year].financialStatement.name}
                                                    </p>
                                                )}
                                            </div>

                                            {/* هزینه ها - Optional */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-sm font-medium text-gray-700 text-rtl">
                                                        ۲. هزینه‌ها <span className="text-gray-400 text-xs">(اختیاری)</span>
                                                    </label>
                                                    {yearFiles[year]?.expenses && (
                                                        <button
                                                            onClick={() => handleRemoveYearFile(year, 'expenses')}
                                                            className="text-xs text-red-600 hover:text-red-800 text-rtl"
                                                        >
                                                            حذف
                                                        </button>
                                                    )}
                                                </div>
                                                <FileUpload
                                                    key={`expenses-${year}-${uploadResetKey}`}
                                                    onFileSelect={(file) => handleYearFileSelect(year, file, 'expenses')}
                                                    acceptedTypes={currentReportType?.acceptedFileTypes || ['.pdf', '.xlsx']}
                                                />
                                                {yearFiles[year]?.expenses && (
                                                    <p className="text-xs text-green-600 text-rtl">
                                                        ✓ {yearFiles[year].expenses.name}
                                                    </p>
                                                )}
                                            </div>

                                            {/* بودجه - Optional */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-sm font-medium text-gray-700 text-rtl">
                                                        ۳. بودجه <span className="text-gray-400 text-xs">(اختیاری)</span>
                                                    </label>
                                                    {yearFiles[year]?.budget && (
                                                        <button
                                                            onClick={() => handleRemoveYearFile(year, 'budget')}
                                                            className="text-xs text-red-600 hover:text-red-800 text-rtl"
                                                        >
                                                            حذف
                                                        </button>
                                                    )}
                                                </div>
                                                <FileUpload
                                                    key={`budget-${year}-${uploadResetKey}`}
                                                    onFileSelect={(file) => handleYearFileSelect(year, file, 'budget')}
                                                    acceptedTypes={currentReportType?.acceptedFileTypes || ['.pdf', '.xlsx']}
                                                />
                                                {yearFiles[year]?.budget && (
                                                    <p className="text-xs text-green-600 text-rtl">
                                                        ✓ {yearFiles[year].budget.name}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {years.some(y => y && yearFiles[y]?.financialStatement) && (
                                        <div className="mt-4">
                                            <Button
                                                onClick={() => setCurrentStep('form')}
                                                className="w-full"
                                            >
                                                ادامه به مرحله بعد
                                            </Button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    {/* صورت مالی - Mandatory */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium text-gray-700 text-rtl">
                                                ۱. صورت مالی <span className="text-red-500">*</span>
                                            </label>
                                        </div>
                                        <FileUpload
                                            key={`financial-${uploadResetKey}`}
                                            onFileSelect={(file) => handleFileSelect(file, 'financialStatement')}
                                            acceptedTypes={currentReportType?.acceptedFileTypes || ['.pdf', '.xlsx']}
                                        />
                                    </div>

                                    {/* هزینه ها - Optional */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium text-gray-700 text-rtl">
                                                ۲. هزینه‌ها <span className="text-gray-400 text-xs">(اختیاری)</span>
                                            </label>
                                        </div>
                                        <FileUpload
                                            key={`expenses-${uploadResetKey}`}
                                            onFileSelect={(file) => handleFileSelect(file, 'expenses')}
                                            acceptedTypes={currentReportType?.acceptedFileTypes || ['.pdf', '.xlsx']}
                                        />
                                    </div>

                                    {/* بودجه - Optional */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium text-gray-700 text-rtl">
                                                ۳. بودجه <span className="text-gray-400 text-xs">(اختیاری)</span>
                                            </label>
                                        </div>
                                        <FileUpload
                                            key={`budget-${uploadResetKey}`}
                                            onFileSelect={(file) => handleFileSelect(file, 'budget')}
                                            acceptedTypes={currentReportType?.acceptedFileTypes || ['.pdf', '.xlsx']}
                                        />
                                    </div>

                                    {selectedFiles.financialStatement && (
                                        <div className="mt-4">
                                            <Button
                                                onClick={() => setCurrentStep('form')}
                                                className="w-full"
                                            >
                                                ادامه به مرحله بعد
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Step 2: Form Fields */}
            {currentStep === 'form' && currentReportType && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900 text-rtl">جزئیات گزارش</h3>
                        <Button variant="outline" onClick={() => setCurrentStep('upload')}>
                            بازگشت
                        </Button>
                    </div>

                    <ExtensibleForm
                        fields={currentReportType.formFields}
                        onChange={handleFormChange}
                    />

                    <div className="flex justify-end space-x-rtl-3">
                        <Button variant="outline" onClick={() => setCurrentStep('upload')}>
                            بازگشت
                        </Button>
                        <Button
                            onClick={() => setCurrentStep('preview')}
                            disabled={!canProceedToPreview}
                        >
                            پیش‌نمایش
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 3: Preview */}
            {currentStep === 'preview' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900 text-rtl">
                            {selectedReportType === '2' ? 'پیش‌نمایش فایل' : 'پیش‌نمایش فایل‌ها'}
                        </h3>
                        <Button variant="outline" onClick={() => setCurrentStep('form')}>
                            بازگشت
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {/* For report type 2, show single file preview */}
                        {selectedReportType === '2' ? (
                            selectedFiles.financialStatement && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-gray-700 text-rtl">
                                        فایل اکسل چند برگه‌ای
                                    </h4>
                                    <FilePreviewer file={selectedFiles.financialStatement} />
                                </div>
                            )
                        ) : selectedReportType === '1' ? (
                            <>
                                {/* Preview files for each year */}
                                {years.filter(y => y).map((year) => (
                                    <div key={year} className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <h4 className="text-md font-semibold text-gray-900 text-rtl mb-3">
                                            پیش‌نمایش فایل‌های سال {year}
                                        </h4>

                                        {/* Preview صورت مالی */}
                                        {yearFiles[year]?.financialStatement && (
                                            <div className="space-y-2">
                                                <h5 className="text-sm font-medium text-gray-700 text-rtl">
                                                    صورت مالی <span className="text-red-500">*</span>
                                                </h5>
                                                <FilePreviewer file={yearFiles[year].financialStatement} />
                                            </div>
                                        )}

                                        {/* Preview هزینه‌ها */}
                                        {yearFiles[year]?.expenses && (
                                            <div className="space-y-2">
                                                <h5 className="text-sm font-medium text-gray-700 text-rtl">
                                                    هزینه‌ها
                                                </h5>
                                                <FilePreviewer file={yearFiles[year].expenses} />
                                            </div>
                                        )}

                                        {/* Preview بودجه */}
                                        {yearFiles[year]?.budget && (
                                            <div className="space-y-2">
                                                <h5 className="text-sm font-medium text-gray-700 text-rtl">
                                                    بودجه
                                                </h5>
                                                <FilePreviewer file={yearFiles[year].budget} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </>
                        ) : (
                            <>
                                {/* Preview صورت مالی */}
                                {selectedFiles.financialStatement && (
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-gray-700 text-rtl">
                                            صورت مالی <span className="text-red-500">*</span>
                                        </h4>
                                        <FilePreviewer file={selectedFiles.financialStatement} />
                                    </div>
                                )}

                                {/* Preview هزینه‌ها */}
                                {selectedFiles.expenses && (
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-gray-700 text-rtl">
                                            هزینه‌ها
                                        </h4>
                                        <FilePreviewer file={selectedFiles.expenses} />
                                    </div>
                                )}

                                {/* Preview بودجه */}
                                {selectedFiles.budget && (
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-gray-700 text-rtl">
                                            بودجه
                                        </h4>
                                        <FilePreviewer file={selectedFiles.budget} />
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="flex justify-end space-x-rtl-3">
                        <Button variant="outline" onClick={() => setCurrentStep('form')}>
                            بازگشت
                        </Button>
                        <Button onClick={handleAnalyze} disabled={!canProceedToAnalysis}>
                            {selectedReportType === '2' ? 'آپلود و پردازش' : 'تحلیل گزارش'}
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 4: Analysis */}
            {currentStep === 'analysis' && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 text-rtl">نتایج تحلیل</h3>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600 text-rtl">{error}</p>
                        </div>
                    )}

                    {(isUploading || isAnalyzing) ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-gray-600 text-rtl">
                                    {isUploading ? 'در حال آپلود فایل...' : 'در حال پردازش فایل‌ها...'}
                                </p>
                                <p className="text-sm text-gray-500 mt-2 text-rtl">
                                    پس از تأیید و اتمام زمان پردازش، می‌توانید نتیجه را دانلود کنید
                                </p>
                            </div>
                        </div>
                    ) : !isUploading && !isAnalyzing && uploadedFilesList.length > 0 ? (
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                                <div className="flex items-center justify-center mb-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                                <h4 className="text-lg font-medium text-gray-900 mb-2 text-rtl">
                                    {selectedReportType === '2'
                                        ? 'فایل با موفقیت آپلود شد'
                                        : selectedReportType === '1'
                                            ? `${uploadedFilesList.length} فایل برای ${years.filter(y => y).length} سال با موفقیت آپلود شدند`
                                            : 'فایل‌ها با موفقیت آپلود شدند'}
                                </h4>
                                <p className="text-sm text-gray-600 mb-4 text-rtl">
                                    وضعیت: در حال پردازش
                                </p>
                                <p className="text-sm text-gray-500 text-rtl">
                                    {selectedReportType === '2'
                                        ? 'پس از تأیید و اتمام زمان پردازش، می‌توانید پیش‌نویس آماده شده را دانلود و مشاهده کنید'
                                        : 'پس از تأیید و اتمام زمان پردازش، می‌توانید نتیجه را از بخش فایل‌ها دانلود کنید'}
                                </p>
                            </div>

                            {selectedReportType === '2' && uploadedFilesList[0] && (
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h5 className="text-sm font-medium text-gray-900 text-rtl">
                                            فایل آپلود شده
                                        </h5>
                                        <span className="text-xs text-gray-500 text-rtl">
                                            در حال پردازش...
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-700 text-rtl mb-4">
                                        <p className="font-medium">{uploadedFilesList[0].fileName}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            پس از اتمام پردازش، می‌توانید پیش‌نویس گزارش را دانلود کنید
                                        </p>
                                    </div>
                                </div>
                            )}

                            {selectedReportType === '1' && uploadedFilesList.length > 0 && (
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h5 className="text-sm font-medium text-gray-900 text-rtl">
                                            فایل‌های آپلود شده
                                        </h5>
                                        <span className="text-xs text-gray-500 text-rtl">
                                            {uploadedFilesList.length} فایل در حال پردازش...
                                        </span>
                                    </div>
                                    <div className="space-y-2 text-sm text-gray-700 text-rtl">
                                        {years.filter(y => y).map((year) => {
                                            const yearUploadedFiles = uploadedFilesList.filter(f => f.formData?.year === year);
                                            if (yearUploadedFiles.length === 0) return null;
                                            return (
                                                <div key={year} className="p-2 bg-gray-50 rounded border border-gray-200">
                                                    <p className="font-medium mb-1">سال {year}:</p>
                                                    <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                                                        {yearUploadedFiles.map((file) => (
                                                            <li key={file.id}>{file.fileName}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            );
                                        })}
                                        <p className="text-xs text-gray-500 mt-2">
                                            پس از اتمام پردازش، می‌توانید نتایج را از بخش فایل‌ها دانلود کنید
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end space-x-rtl-3">
                                <Button variant="outline" onClick={resetForm}>
                                    آپلود دیگری
                                </Button>
                                <Button onClick={() => {
                                    if (uploadedFilesList[0]) {
                                        onFileUploaded(uploadedFilesList[0]);
                                    }
                                    resetForm();
                                }}>
                                    مشاهده فایل‌ها
                                </Button>
                            </div>
                        </div>
                    ) : analysisResult ? (
                        <div className="space-y-4">
                            <FilePreviewer analysisResult={analysisResult} />

                            <div className="flex justify-end space-x-rtl-3">
                                <Button variant="outline" onClick={resetForm}>
                                    آپلود دیگری
                                </Button>
                                <Button onClick={() => setCurrentStep('preview')}>
                                    مشاهده جزئیات
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
};
