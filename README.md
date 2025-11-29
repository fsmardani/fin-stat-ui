# Report Generator - Next.js App

A comprehensive Next.js application for uploading, analyzing, and managing financial reports with AI-powered insights.

## Features

### 1. File Upload Module
- **Configurable file types**: Support for PDF, Excel (.xlsx, .xls), and Word documents
- **Drag & drop interface**: Modern file upload with visual feedback
- **File validation**: Size limits and type checking
- **Progress tracking**: Real-time upload status

### 2. Report Analysis Engine
- **AI-powered analysis**: Automated extraction of key insights from reports
- **Multiple report types**: Financial statements, audit reports, compliance reports
- **Confidence scoring**: Analysis reliability indicators
- **Structured data extraction**: Organized output for further processing

### 3. Universal Previewer
- **Multi-format support**: Preview for PDF, Excel, and text files
- **Analysis results display**: Formatted output with insights and metrics
- **Download functionality**: Easy access to original files
- **Responsive design**: Works on all device sizes

### 4. Extensible Form System
- **Dynamic form fields**: Configurable forms per report type
- **Field validation**: Real-time validation with error messages
- **Multiple input types**: Text, number, date, select, textarea
- **Required field handling**: Smart form progression

### 5. File Log Management
- **Comprehensive table**: All uploaded files with metadata
- **Advanced filtering**: By company, report type, date range, status
- **Sorting capabilities**: Multiple sort options with visual indicators
- **Status tracking**: Pending, processing, completed, failed states
- **Bulk operations**: View and download multiple files

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Lucide React icons
- **File Handling**: React Dropzone, File API
- **State Management**: React hooks and local state

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fin-stat-ui
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   └── Textarea.tsx
│   ├── FileUpload.tsx    # File upload component
│   ├── FilePreviewer.tsx # File preview component
│   ├── ExtensibleForm.tsx # Dynamic form component
│   ├── FileLogTable.tsx  # File management table
│   └── ReportUploadForm.tsx # Main upload form
├── lib/                  # Utility libraries
│   ├── constants.ts      # App constants and data
│   └── analysisEngine.ts # Analysis logic
└── types/               # TypeScript type definitions
    └── index.ts
```

## Usage

### Uploading Reports

1. **Select Company**: Choose from predefined companies
2. **Choose Report Type**: Select the type of report (Financial Statement, Audit Report, Compliance Report)
3. **Upload File**: Drag and drop or select a file
4. **Fill Details**: Complete the dynamic form based on report type
5. **Preview**: Review the uploaded file
6. **Analyze**: Run AI analysis to extract insights

### Managing Files

- **View All Files**: Access the File Log tab to see all uploaded files
- **Filter & Search**: Use the comprehensive filtering system
- **Track Status**: Monitor analysis progress and results
- **Download**: Access original files and analysis results

## Configuration

### Adding New Companies
Edit `src/lib/constants.ts` to add new companies:

```typescript
export const COMPANIES: Company[] = [
  { id: '1', name: 'Your Company', code: 'YOUR' },
  // ... existing companies
];
```

### Adding New Report Types
Add new report types with custom form fields:

```typescript
export const REPORT_TYPES: ReportType[] = [
  {
    id: '4',
    name: 'Custom Report',
    description: 'Your custom report type',
    acceptedFileTypes: ['.pdf', '.xlsx'],
    formFields: [
      {
        id: 'customField',
        name: 'customField',
        type: 'text',
        label: 'Custom Field',
        required: true,
        placeholder: 'Enter value...'
      }
    ]
  }
];
```

### File Upload Configuration
Modify upload settings in `src/lib/constants.ts`:

```typescript
export const FILE_UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  acceptedTypes: ['.pdf', '.xlsx', '.xls', '.docx'],
  multiple: false
};
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Features

1. **New File Types**: Extend the analysis engine in `src/lib/analysisEngine.ts`
2. **Custom Form Fields**: Add new field types in `src/components/ExtensibleForm.tsx`
3. **Additional Filters**: Extend the file log table in `src/components/FileLogTable.tsx`

## Production Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

Or deploy to platforms like Vercel, Netlify, or AWS.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.