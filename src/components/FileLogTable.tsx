'use client';

import React, { useState, useMemo } from 'react';
import { UploadedFile, Company, ReportType } from '@/types';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { Input } from './ui/Input';
import PersianDatePicker from './ui/PersianDatePicker';
import moment from 'moment-jalaali';
import {
    Search,
    Filter,
    Download,
    Eye,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Calendar,
    Check
} from 'lucide-react';

interface FileLogTableProps {
    files: UploadedFile[];
    companies: Company[];
    reportTypes: ReportType[];
    onViewFile: (file: UploadedFile) => void;
    onDownloadFile: (file: UploadedFile) => void;
    onDownloadDraft?: (file: UploadedFile) => void;
    onMarkCompleted?: (file: UploadedFile) => void;
    className?: string;
}

export const FileLogTable: React.FC<FileLogTableProps> = ({
    files,
    companies,
    reportTypes,
    onViewFile,
    onDownloadFile,
    onDownloadDraft,
    onMarkCompleted,
    className
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCompany, setSelectedCompany] = useState('');
    const [selectedReportType, setSelectedReportType] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [sortBy, setSortBy] = useState<'uploadDate' | 'fileName' | 'companyId'>('uploadDate');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const filteredAndSortedFiles = useMemo(() => {
        let filtered = files.filter(file => {
            const matchesSearch = file.fileName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCompany = !selectedCompany || file.companyId === selectedCompany;
            const matchesReportType = !selectedReportType || file.reportTypeId === selectedReportType;
            const matchesStatus = !selectedStatus || file.analysisStatus === selectedStatus;

            // Convert file date to Persian date for comparison
            const fileDate = moment(file.uploadDate);
            const filePersianDate = fileDate.format('jYYYY/jMM/jDD');

            const matchesDateFrom = !dateFrom || filePersianDate >= dateFrom;
            const matchesDateTo = !dateTo || filePersianDate <= dateTo;

            return matchesSearch && matchesCompany && matchesReportType && matchesStatus && matchesDateFrom && matchesDateTo;
        });

        // Sort files
        filtered.sort((a, b) => {
            let aValue: any, bValue: any;

            switch (sortBy) {
                case 'uploadDate':
                    aValue = new Date(a.uploadDate);
                    bValue = new Date(b.uploadDate);
                    break;
                case 'fileName':
                    aValue = a.fileName.toLowerCase();
                    bValue = b.fileName.toLowerCase();
                    break;
                case 'companyId':
                    aValue = companies.find(c => c.id === a.companyId)?.name || '';
                    bValue = companies.find(c => c.id === b.companyId)?.name || '';
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [files, searchTerm, selectedCompany, selectedReportType, selectedStatus, dateFrom, dateTo, sortBy, sortOrder, companies]);

    const getStatusIcon = (status: UploadedFile['analysisStatus']) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'processing':
                return <Clock className="h-4 w-4 text-blue-500" />;
            case 'failed':
                return <XCircle className="h-4 w-4 text-red-500" />;
            default:
                return <AlertCircle className="h-4 w-4 text-yellow-500" />;
        }
    };

    const getStatusText = (status: UploadedFile['analysisStatus']) => {
        switch (status) {
            case 'completed':
                return 'تکمیل شده';
            case 'processing':
                return 'در حال پردازش';
            case 'failed':
                return 'ناموفق';
            default:
                return 'در انتظار';
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleSort = (column: typeof sortBy) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Filters */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 text-rtl mb-1">
                            جستجو
                        </label>
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="جستجوی فایل‌ها..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <Select
                        label="شرکت"
                        value={selectedCompany}
                        onChange={(e) => setSelectedCompany(e.target.value)}
                        options={[
                            { value: '', label: 'همه شرکت‌ها' },
                            ...companies.map(company => ({
                                value: company.id,
                                label: company.name
                            }))
                        ]}
                    />

                    <Select
                        label="نوع گزارش"
                        value={selectedReportType}
                        onChange={(e) => setSelectedReportType(e.target.value)}
                        options={[
                            { value: '', label: 'همه انواع' },
                            ...reportTypes.map(type => ({
                                value: type.id,
                                label: type.name,
                                disabled: type.disabled || false
                            }))
                        ]}
                    />

                    <Select
                        label="وضعیت"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        options={[
                            { value: '', label: 'همه وضعیت‌ها' },
                            { value: 'pending', label: 'در انتظار' },
                            { value: 'processing', label: 'در حال پردازش' },
                            { value: 'completed', label: 'تکمیل شده' },
                            { value: 'failed', label: 'ناموفق' }
                        ]}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 text-rtl mb-1">
                            از تاریخ
                        </label>
                        <PersianDatePicker
                            value={dateFrom}
                            onChange={setDateFrom}
                            placeholder="تاریخ شروع را انتخاب کنید"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 text-rtl mb-1">
                            تا تاریخ
                        </label>
                        <PersianDatePicker
                            value={dateTo}
                            onChange={setDateTo}
                            placeholder="تاریخ پایان را انتخاب کنید"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('fileName')}
                                >
                                    نام فایل {sortBy === 'fileName' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th
                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('companyId')}
                                >
                                    شرکت {sortBy === 'companyId' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    نوع گزارش
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    اندازه
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    وضعیت
                                </th>
                                <th
                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('uploadDate')}
                                >
                                    تاریخ آپلود {sortBy === 'uploadDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    عملیات
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredAndSortedFiles.map((file) => {
                                const company = companies.find(c => c.id === file.companyId);
                                const reportType = reportTypes.find(rt => rt.id === file.reportTypeId);

                                return (
                                    <tr key={file.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 text-rtl">{file.fileName}</div>
                                            <div className="text-sm text-gray-500">{file.fileType.toUpperCase()}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 text-rtl">{company?.name || 'نامشخص'}</div>
                                            <div className="text-sm text-gray-500">{company?.code || ''}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 text-rtl">{reportType?.name || 'نامشخص'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatFileSize(file.fileSize)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-rtl-2">
                                                {getStatusIcon(file.analysisStatus)}
                                                <span className="text-sm text-gray-900 text-rtl">{getStatusText(file.analysisStatus)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-rtl">
                                            {moment(file.uploadDate).format('jYYYY/jMM/jDD')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-rtl-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onViewFile(file)}
                                                    className="text-blue-600 hover:text-blue-700"
                                                    title={file.reportTypeId === '2' && file.analysisStatus === 'completed' 
                                                        ? 'مشاهده پیش‌نویس' 
                                                        : 'مشاهده فایل'}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {file.analysisStatus === 'processing' && onMarkCompleted && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => onMarkCompleted(file)}
                                                        className="text-orange-600 hover:text-orange-700"
                                                        title="علامت‌گذاری به عنوان تکمیل شده (برای تست)"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {file.reportTypeId === '2' && file.analysisStatus === 'completed' && onDownloadDraft ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => onDownloadDraft(file)}
                                                        className="text-purple-600 hover:text-purple-700"
                                                        title="دانلود پیش‌نویس Word"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => onDownloadFile(file)}
                                                        disabled={file.analysisStatus !== 'completed'}
                                                        className={`${file.analysisStatus === 'completed' 
                                                            ? 'text-green-600 hover:text-green-700' 
                                                            : 'text-gray-400 cursor-not-allowed'}`}
                                                        title={file.analysisStatus !== 'completed' 
                                                            ? 'فایل باید پردازش شود تا قابل دانلود باشد' 
                                                            : 'دانلود فایل'}
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredAndSortedFiles.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-gray-500 text-rtl">هیچ فایلی مطابق با معیارهای شما یافت نشد</p>
                    </div>
                )}
            </div>
        </div>
    );
};
