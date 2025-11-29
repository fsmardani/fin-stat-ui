export interface Company {
    id: string;
    name: string;
    code: string;
}

export interface ReportType {
    id: string;
    name: string;
    description: string;
    acceptedFileTypes: string[];
    formFields: FormField[];
    disabled?: boolean;
}

export interface FormField {
    id: string;
    name: string;
    type: 'text' | 'number' | 'date' | 'select' | 'textarea';
    label: string;
    required: boolean;
    options?: string[];
    placeholder?: string;
}

export interface UploadedFile {
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    companyId: string;
    reportTypeId: string;
    uploadDate: Date;
    analysisStatus: 'pending' | 'processing' | 'completed' | 'failed';
    analysisResult?: AnalysisResult;
    formData?: Record<string, any>;
}

export interface AnalysisResult {
    id: string;
    summary: string;
    insights: string[];
    data: any;
    confidence: number;
    processedAt: Date;
}

export interface FileUploadConfig {
    maxFileSize: number; // in bytes
    acceptedTypes: string[];
    multiple: boolean;
}




