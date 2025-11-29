'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ReportUploadForm } from '@/components/ReportUploadForm';
import { FileLogTable } from '@/components/FileLogTable';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { UploadedFile } from '@/types';
import { COMPANIES, REPORT_TYPES } from '@/lib/constants';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, BarChart3, Upload, Database, LogOut, User, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
// Import docx-preview dynamically to avoid SSR issues

export default function Home() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'files'>('upload');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<UploadedFile | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string>('');
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewReady, setPreviewReady] = useState(false);

  // Fetch files from API
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getFiles();
        if (response.success && response.data?.files) {
          // Map API file format to UploadedFile interface
          const files: UploadedFile[] = response.data.files.map((file: any) => ({
            id: file._id,
            fileName: file.originalFileName,
            fileType: file.fileType,
            fileSize: file.fileSize,
            companyId: file.companyId,
            reportTypeId: file.reportTypeId,
            uploadDate: new Date(file.uploadDate),
            analysisStatus: file.analysisStatus,
            analysisResult: file.analysisResult,
            formData: file.formData || {}
          }));
          setUploadedFiles(files);
        }
      } catch (error) {
        console.error('Error fetching files:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFiles();
  }, []);

  const handleFileUploaded = (file: UploadedFile) => {
    setUploadedFiles(prev => [file, ...prev]);
    setActiveTab('files'); // Switch to files tab after successful upload
  };

  const handleViewFile = async (file: UploadedFile) => {
    // For type 2 completed reports, show Word preview
    if (file.reportTypeId === '2' && file.analysisStatus === 'completed') {
      setSelectedFileForPreview(file);
      setIsPreviewModalOpen(true);
      setIsLoadingPreview(true);
      setPreviewError('');
      setPreviewReady(false);

      try {
        // Fetch the draft file as blob
        const blob = await apiClient.getDraftBlob(file.id);

        console.log('Blob received:', {
          type: blob.type,
          size: blob.size
        });

        // Verify blob is not empty
        if (blob.size === 0) {
          throw new Error('فایل خالی است');
        }

        // Render Word document preview using mammoth.js
        if (previewContainerRef.current) {
          try {
            // Dynamically import mammoth
            const mammoth = await import('mammoth');

            console.log('Converting Word to HTML with mammoth...');

            // Convert Word document to HTML
            const result = await mammoth.convertToHtml({ arrayBuffer: await blob.arrayBuffer() });

            console.log('Conversion successful, HTML length:', result.value.length);

            // Display the HTML
            if (previewContainerRef.current) {
              previewContainerRef.current.innerHTML = `
                <div style="direction: rtl; text-align: right; padding: 20px; max-width: 100%;">
                  ${result.value}
                </div>
              `;

              // Apply RTL styles to all elements
              const allElements = previewContainerRef.current.querySelectorAll('*');
              allElements.forEach((el) => {
                (el as HTMLElement).style.direction = 'rtl';
                (el as HTMLElement).style.textAlign = 'right';
              });

              setPreviewReady(true);
              console.log('Preview displayed successfully');
            }
          } catch (mammothError: any) {
            console.error('Mammoth conversion error:', mammothError);
            // Fallback to download interface
            const fileUrl = URL.createObjectURL(blob);
            const downloadFilename = `${file.fileName.replace(/\.[^/.]+$/, '')} - پیش نویس.docx`;

            (window as any).downloadPreviewFile = (url: string, filename: string) => {
              const link = document.createElement('a');
              link.href = url;
              link.download = filename;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            };

            if (previewContainerRef.current) {
              previewContainerRef.current.innerHTML = `
                <div style="padding: 40px; text-align: center; direction: rtl;">
                  <p style="color: #ef4444; margin-bottom: 20px;">خطا در نمایش پیش‌نمایش</p>
                  <p style="color: #6b7280; margin-bottom: 20px;">لطفاً فایل را دانلود کنید</p>
                  <button 
                    onclick="window.downloadPreviewFile('${fileUrl}', '${downloadFilename.replace(/'/g, "\\'")}')"
                    style="background-color: #10b981; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer;"
                  >
                    دانلود پیش‌نویس
                  </button>
                </div>
              `;
            }
            setPreviewReady(true);
          }
        }
      } catch (error: any) {
        console.error('Error loading preview:', error);
        setPreviewError(error.message || 'خطا در بارگذاری پیش‌نمایش');
      } finally {
        setIsLoadingPreview(false);
      }
    } else {
      // For other files, show alert (or implement other preview)
      console.log('View file:', file);
      alert(`Viewing file: ${file.fileName}\nStatus: ${file.analysisStatus}\nCompany: ${COMPANIES.find(c => c.id === file.companyId)?.name}`);
    }
  };

  const handleDownloadFile = async (file: UploadedFile) => {
    try {
      await apiClient.downloadFile(file.id);
    } catch (error: any) {
      console.error('Error downloading file:', error);
      alert(error.message || 'خطا در دانلود فایل. لطفاً دوباره تلاش کنید.');
    }
  };

  const handleDownloadDraft = async (file: UploadedFile) => {
    try {
      await apiClient.downloadDraft(file.id);
    } catch (error: any) {
      console.error('Error downloading draft:', error);
      const errorMessage = error.message || 'خطا در دانلود پیش‌نویس. لطفاً دوباره تلاش کنید.';
      alert(errorMessage);
    }
  };

  const handleMarkCompleted = async (file: UploadedFile) => {
    try {
      await apiClient.updateFileAnalysis(file.id, 'completed', {
        summary: 'پردازش تکمیل شد',
        insights: ['فایل با موفقیت پردازش شد'],
        confidence: 0.95,
        processedAt: new Date()
      });

      // Update local state
      setUploadedFiles(prev => prev.map(f =>
        f.id === file.id
          ? { ...f, analysisStatus: 'completed' as const }
          : f
      ));
    } catch (error: any) {
      console.error('Error marking as completed:', error);
      alert(error.message || 'خطا در به‌روزرسانی وضعیت. لطفاً دوباره تلاش کنید.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 text-rtl">GoalRepo</h1>
                  <p className="text-sm text-gray-500 text-rtl">تحلیل گزارش‌های مالی با هوش مصنوعی</p>
                </div>
              </div>

              <div className="flex items-center space-x-rtl-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 text-rtl">
                    {uploadedFiles.length} فایل پردازش شده
                  </p>
                  <p className="text-xs text-gray-500 text-rtl">
                    {uploadedFiles.filter(f => f.analysisStatus === 'completed').length} تکمیل شده
                  </p>
                </div>
                <div className="flex items-center space-x-rtl-2 border-r border-gray-300 pr-4">
                  <User className="h-5 w-5 text-gray-500" />
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 text-rtl">
                      {user?.username || 'کاربر'}
                    </p>
                    <p className="text-xs text-gray-500 text-rtl">
                      {user?.role === 'admin' ? 'مدیر' : 'کاربر'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center space-x-rtl-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-rtl">خروج</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex items-center space-x-rtl-2 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'upload'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <Upload className="h-4 w-4" />
                <span className="text-rtl">آپلود گزارش</span>
              </button>
              <button
                onClick={() => setActiveTab('files')}
                className={`flex items-center space-x-rtl-2 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'files'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <Database className="h-4 w-4" />
                <span className="text-rtl">لیست فایل‌ها ({uploadedFiles.length})</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'upload' && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: '3rem' }}>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                        <Upload className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500 text-rtl">کل آپلودها</p>
                      <p className="text-2xl font-bold text-gray-900">{uploadedFiles.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                        <BarChart3 className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500 text-rtl">تحلیل‌های تکمیل شده</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {uploadedFiles.filter(f => f.analysisStatus === 'completed').length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
                        <FileText className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500 text-rtl">انواع گزارش</p>
                      <p className="text-2xl font-bold text-gray-900">{REPORT_TYPES.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Form */}
              <ReportUploadForm
                companies={COMPANIES}
                reportTypes={REPORT_TYPES}
                onFileUploaded={handleFileUploaded}
                className="mt-4"
              />
            </div>
          )}

          {activeTab === 'files' && (
            <>
              <FileLogTable
                files={uploadedFiles}
                companies={COMPANIES}
                reportTypes={REPORT_TYPES}
                onViewFile={handleViewFile}
                onDownloadFile={handleDownloadFile}
                onDownloadDraft={handleDownloadDraft}
                onMarkCompleted={handleMarkCompleted}
              />
            </>
          )}
        </main>

        {/* Word Preview Modal for Type 2 Reports */}
        {isPreviewModalOpen && selectedFileForPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900 text-rtl">
                  پیش‌نمایش پیش‌نویس: {selectedFileForPreview.fileName}
                </h3>
                <div className="flex items-center space-x-rtl-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadDraft(selectedFileForPreview)}
                    className="text-green-600 hover:text-green-700"
                  >
                    دانلود پیش‌نویس
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsPreviewModalOpen(false);
                      setSelectedFileForPreview(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 p-4 overflow-hidden flex flex-col">
                {isLoadingPreview ? (
                  <div className="w-full h-full border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-sm text-gray-600 text-rtl">در حال بارگذاری پیش‌نمایش...</p>
                    </div>
                  </div>
                ) : previewError ? (
                  <div className="w-full h-full border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center">
                    <div className="text-center p-8">
                      <FileText className="h-16 w-16 text-red-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-red-900 mb-2 text-rtl">
                        خطا در بارگذاری
                      </h4>
                      <p className="text-sm text-gray-600 mb-6 text-rtl">{previewError}</p>
                      <Button
                        onClick={() => handleViewFile(selectedFileForPreview)}
                        className="text-rtl"
                      >
                        تلاش مجدد
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    ref={previewContainerRef}
                    className="flex-1 overflow-auto border border-gray-200 rounded-lg bg-white p-4"
                    style={{
                      direction: 'rtl',
                      minHeight: '400px',
                      position: 'relative',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    {!previewReady && !previewError && (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-rtl">در حال بارگذاری سند...</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-gray-500 text-sm">
              <p className="text-rtl">© Powered by Farakav Team</p>
            </div>
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  );
}