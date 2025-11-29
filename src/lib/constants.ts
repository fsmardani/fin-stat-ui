import { Company, ReportType } from '@/types';

export const COMPANIES: Company[] = [
    { id: '1', name: 'سروش مانا فارمد', code: 'SRM' },
    { id: '2', name: 'فاران فارمد', code: 'FRN' },
    { id: '3', name: 'سرمایه گذاری دارویی گلرنگ', code: 'GLG' },
    { id: '4', name: 'آرین سلامت سینا', code: 'ARN' },
    { id: '5', name: 'ابیان دارو', code: 'ABD' },
    { id: '6', name: 'تحقیقاتی و تولیدی واریان فارمد', code: 'VRY' },
    { id: '7', name: 'فاران شیمی تویسرکان', code: 'FRT' },
    { id: '8', name: 'ابیان فارمد', code: 'ABF' },
    { id: '9', name: 'فارمد سلامت سينا', code: 'FSH' },
    { id: '10', name: 'ابيان سلامت', code: 'ABS' },
    { id: '11', name: 'هستی آریا شیمی', code: 'HSA' },
    { id: '12', name: 'گسترش هستی سلامت شیمی', code: 'GHS' },
    { id: '13', name: 'هستی بهین فارمد', code: 'HBF' },
    { id: '14', name: 'پژوهش گستران تغذیه آسان', code: 'PGT' },
];

export const REPORT_TYPES: ReportType[] = [
    {
        id: '1',
        name: 'صورت‌های مالی',
        description: 'گزارش‌های مالی سالانه یا فصلی',
        acceptedFileTypes: ['.pdf', '.xlsx', '.xls'],
        formFields: [
            {
                id: 'period',
                name: 'period',
                type: 'select',
                label: 'دوره گزارش‌دهی',
                required: true,
                options: ['سه‌ماهه اول', 'سه‌ماهه دوم', 'سه‌ماهه سوم', 'سه‌ماهه چهارم', 'سالانه']
            },
            {
                id: 'year',
                name: 'year',
                type: 'number',
                label: 'سال',
                required: true,
                placeholder: '۱۴۰۳'
            },
            {
                id: 'currency',
                name: 'currency',
                type: 'select',
                label: 'واحد پول',
                required: true,
                options: ['ریال', 'دلار', 'یورو', 'پوند']
            }
        ]
    },
    {
        id: '2',
        name: 'گزارش حسابرسی(ارزیابی عملکرد)',
        description: 'گزارش حسابرسی با ارزیابی عملکرد - آپلود فایل اکسل چند برگه‌ای',
        acceptedFileTypes: ['.xlsx', '.xls'],
        formFields: [
            {
                id: 'ragAlgorithm',
                name: 'ragAlgorithm',
                type: 'select',
                label: 'الگوریتم RAG',
                required: true,
                options: ['Vector Search', 'BM25', 'Hybrid', 'Semantic Search']
            },
            {
                id: 'year',
                name: 'year',
                type: 'number',
                label: 'سال',
                required: true,
                placeholder: '۱۴۰۳'
            }
        ],
        disabled: false
    },
    {
        id: '3',
        name: 'گزارش انطباق',
        description: 'انطباق مقرراتی و ارزیابی ریسک',
        acceptedFileTypes: ['.pdf', '.xlsx', '.xls', '.docx'],
        formFields: [
            {
                id: 'regulation',
                name: 'regulation',
                type: 'text',
                label: 'نوع مقررات',
                required: true,
                placeholder: 'SOX، GDPR و غیره'
            },
            {
                id: 'complianceDate',
                name: 'complianceDate',
                type: 'date',
                label: 'تاریخ انطباق',
                required: true
            },
            {
                id: 'notes',
                name: 'notes',
                type: 'textarea',
                label: 'یادداشت‌های اضافی',
                required: false,
                placeholder: 'هر زمینه یا یادداشت اضافی...'
            }
        ],
        disabled: true
    }
];

export const FILE_UPLOAD_CONFIG = {
    maxFileSize: 1024 * 1024 * 1024, // 1GB (effectively no limit)
    acceptedTypes: ['.pdf', '.xlsx', '.xls', '.docx'],
    multiple: false
};
