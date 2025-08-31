import jsPDF from 'jspdf';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

export interface ConversionOptions {
  quality?: number;
}

// Main conversion function that orchestrates different file type conversions
export async function convertFile(file: File, targetFormat: string, options: ConversionOptions = {}): Promise<Blob> {
  console.log(`Converting ${file.name} from ${file.type} to ${targetFormat}`);
  
  switch (targetFormat.toLowerCase()) {
    case 'pdf':
      return await convertToPDF(file);
    case 'txt':
    case 'text':
      return await convertToText(file);
    case 'docx':
      return await convertToDocx(file);
    case 'xlsx':
      return await convertToExcel(file);
    case 'csv':
      return await convertToCSV(file);
    case 'json':
      return await convertToJSON(file);
    case 'jpg':
    case 'jpeg':
      return await convertToJPEG(file, options);
    case 'png':
      return await convertToPNG(file);
    case 'webp':
      return await convertToWebP(file, options);
    default:
      throw new Error(`Unsupported target format: ${targetFormat}`);
  }
}

// Convert various file types to plain text
async function convertToText(file: File): Promise<Blob> {
  const fileType = file.type.toLowerCase();
  
  if (fileType.includes('text/')) {
    // Already text, just return as blob
    return new Blob([await file.text()], { type: 'text/plain' });
  }
  
  if (fileType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') || 
      file.name.toLowerCase().endsWith('.docx')) {
    // Convert DOCX to text using mammoth
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return new Blob([result.value], { type: 'text/plain' });
    } catch (error) {
      console.error('Error converting DOCX to text:', error);
      return new Blob([`Error converting ${file.name} to text: ${error.message}`], { type: 'text/plain' });
    }
  }
  
  if (fileType.includes('json')) {
    const text = await file.text();
    try {
      const json = JSON.parse(text);
      return new Blob([JSON.stringify(json, null, 2)], { type: 'text/plain' });
    } catch {
      return new Blob([text], { type: 'text/plain' });
    }
  }
  
  if (fileType.includes('csv') || fileType.includes('spreadsheet')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const csvData = XLSX.utils.sheet_to_csv(worksheet);
      return new Blob([csvData], { type: 'text/plain' });
    } catch (error) {
      return new Blob([`Error converting ${file.name} to text: ${error.message}`], { type: 'text/plain' });
    }
  }
  
  // For other file types, create a description
  const description = `File: ${file.name}\nType: ${file.type}\nSize: ${formatFileSize(file.size)}\nLast Modified: ${new Date(file.lastModified).toLocaleString()}\n\nThis file type cannot be converted to text format.`;
  return new Blob([description], { type: 'text/plain' });
}

// Convert various file types to PDF
async function convertToPDF(file: File): Promise<Blob> {
  const pdf = new jsPDF();
  const fileType = file.type.toLowerCase();
  
  try {
    if (fileType.includes('text/')) {
      // Convert text to PDF
      const text = await file.text();
      const lines = pdf.splitTextToSize(text, 180);
      let y = 20;
      
      lines.forEach((line: string) => {
        if (y > 280) {
          pdf.addPage();
          y = 20;
        }
        pdf.text(line, 10, y);
        y += 7;
      });
    } 
    else if (fileType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') || 
             file.name.toLowerCase().endsWith('.docx')) {
      // Convert DOCX to PDF via text extraction
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const lines = pdf.splitTextToSize(result.value, 180);
      let y = 20;
      
      lines.forEach((line: string) => {
        if (y > 280) {
          pdf.addPage();
          y = 20;
        }
        pdf.text(line, 10, y);
        y += 7;
      });
    }
    else if (fileType.includes('json')) {
      // Convert JSON to formatted PDF
      const text = await file.text();
      const jsonData = JSON.parse(text);
      const formattedText = JSON.stringify(jsonData, null, 2);
      const lines = pdf.splitTextToSize(formattedText, 180);
      let y = 20;
      
      lines.forEach((line: string) => {
        if (y > 280) {
          pdf.addPage();
          y = 20;
        }
        pdf.text(line, 10, y);
        y += 7;
      });
    }
    else if (fileType.includes('csv') || fileType.includes('spreadsheet')) {
      // Convert CSV/Excel to PDF table
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const csvData = XLSX.utils.sheet_to_csv(worksheet);
      const lines = pdf.splitTextToSize(csvData, 180);
      let y = 20;
      
      lines.forEach((line: string) => {
        if (y > 280) {
          pdf.addPage();
          y = 20;
        }
        pdf.text(line, 10, y);
        y += 7;
      });
    }
    else if (fileType.includes('image/')) {
      // Convert image to PDF
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          
          const imgData = canvas.toDataURL('image/jpeg', 0.8);
          const imgWidth = 180;
          const imgHeight = (img.height * imgWidth) / img.width;
          
          pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight);
          resolve(new Blob([pdf.output('blob')], { type: 'application/pdf' }));
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
      });
    }
    else {
      // For unsupported formats, create a PDF with file metadata
      pdf.text(`File: ${file.name}`, 10, 20);
      pdf.text(`Type: ${file.type}`, 10, 30);
      pdf.text(`Size: ${formatFileSize(file.size)}`, 10, 40);
      pdf.text(`Last Modified: ${new Date(file.lastModified).toLocaleString()}`, 10, 50);
      pdf.text('This file type cannot be directly converted to PDF.', 10, 70);
    }
    
    return new Blob([pdf.output('blob')], { type: 'application/pdf' });
  } catch (error) {
    console.error('Error converting to PDF:', error);
    // Create error PDF
    pdf.text(`Error converting ${file.name} to PDF`, 10, 20);
    pdf.text(`Error: ${error.message}`, 10, 30);
    return new Blob([pdf.output('blob')], { type: 'application/pdf' });
  }
}

// Convert to DOCX format (simplified - creates RTF which many programs can open as DOCX)
async function convertToDocx(file: File): Promise<Blob> {
  const fileType = file.type.toLowerCase();
  
  try {
    let content = '';
    
    if (fileType.includes('text/')) {
      content = await file.text();
    } else if (fileType.includes('json')) {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      content = JSON.stringify(jsonData, null, 2);
    } else {
      content = `File: ${file.name}\nType: ${file.type}\nSize: ${formatFileSize(file.size)}\n\nThis file type cannot be converted to DOCX format.`;
    }
    
    // Create RTF content (which can be opened by Word as DOCX)
    const rtfContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}} \\f0\\fs24 ${content.replace(/\n/g, '\\par ')}}`;
    return new Blob([rtfContent], { type: 'application/rtf' });
  } catch (error) {
    console.error('Error converting to DOCX:', error);
    const errorContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}} \\f0\\fs24 Error converting ${file.name} to DOCX: ${error.message}}`;
    return new Blob([errorContent], { type: 'application/rtf' });
  }
}

// Convert to Excel format
async function convertToExcel(file: File): Promise<Blob> {
  const fileType = file.type.toLowerCase();
  
  try {
    let data: any[][] = [];
    
    if (fileType.includes('csv')) {
      const text = await file.text();
      const rows = text.split('\n').map(row => row.split(','));
      data = rows;
    } else if (fileType.includes('json')) {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      
      if (Array.isArray(jsonData)) {
        if (jsonData.length > 0 && typeof jsonData[0] === 'object') {
          // Array of objects - convert to table
          const headers = Object.keys(jsonData[0]);
          data = [headers, ...jsonData.map(obj => headers.map(header => obj[header] || ''))];
        } else {
          // Simple array
          data = [['Value'], ...jsonData.map(item => [item])];
        }
      } else if (typeof jsonData === 'object') {
        // Single object
        data = [['Key', 'Value'], ...Object.entries(jsonData)];
      }
    } else if (fileType.includes('text/')) {
      const text = await file.text();
      const lines = text.split('\n');
      data = [['Line Number', 'Content'], ...lines.map((line, index) => [index + 1, line])];
    } else {
      data = [
        ['Property', 'Value'],
        ['File Name', file.name],
        ['File Type', file.type],
        ['File Size', formatFileSize(file.size)],
        ['Last Modified', new Date(file.lastModified).toLocaleString()]
      ];
    }
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  } catch (error) {
    console.error('Error converting to Excel:', error);
    const errorData = [
      ['Error', `Failed to convert ${file.name} to Excel`],
      ['Message', error.message]
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(errorData);
    XLSX.utils.book_append_sheet(wb, ws, 'Error');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
}

// Convert image files to JPEG
async function convertToJPEG(file: File, options: ConversionOptions): Promise<Blob> {
  if (!file.type.includes('image/')) {
    throw new Error('File is not an image');
  }
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert image to JPEG'));
          }
        },
        'image/jpeg',
        options.quality || 0.8
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

// Convert image files to PNG
async function convertToPNG(file: File): Promise<Blob> {
  if (!file.type.includes('image/')) {
    throw new Error('File is not an image');
  }
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert image to PNG'));
          }
        },
        'image/png'
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

// Convert image files to WebP
async function convertToWebP(file: File, options: ConversionOptions): Promise<Blob> {
  if (!file.type.includes('image/')) {
    throw new Error('File is not an image');
  }
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert image to WebP'));
          }
        },
        'image/webp',
        options.quality || 0.8
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

// Convert various file types to JSON
async function convertToJSON(file: File): Promise<Blob> {
  const fileType = file.type.toLowerCase();
  
  try {
    if (fileType.includes('json')) {
      // Already JSON, validate and pretty-print
      const text = await file.text();
      const jsonData = JSON.parse(text);
      return new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    }
    
    if (fileType.includes('csv')) {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const data = lines.slice(1).map(line => {
        const values = line.split(',');
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = values[index]?.trim() || '';
        });
        return obj;
      });
      return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    }
    
    if (fileType.includes('text/')) {
      const text = await file.text();
      const jsonData = {
        filename: file.name,
        content: text,
        lineCount: text.split('\n').length,
        characterCount: text.length,
        wordCount: text.split(/\s+/).length
      };
      return new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    }
    
    // For other file types, create metadata JSON
    const metadata = {
      filename: file.name,
      type: file.type,
      size: file.size,
      lastModified: new Date(file.lastModified).toISOString(),
      sizeFormatted: formatFileSize(file.size)
    };
    
    return new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
  } catch (error) {
    console.error('Error converting to JSON:', error);
    const errorData = {
      error: `Failed to convert ${file.name} to JSON`,
      message: error.message,
      filename: file.name,
      type: file.type
    };
    return new Blob([JSON.stringify(errorData, null, 2)], { type: 'application/json' });
  }
}

// Convert various file types to CSV
async function convertToCSV(file: File): Promise<Blob> {
  const fileType = file.type.toLowerCase();
  
  try {
    if (fileType.includes('csv')) {
      // Already CSV, just return as is
      return new Blob([await file.text()], { type: 'text/csv' });
    }
    
    if (fileType.includes('json')) {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      
      if (Array.isArray(jsonData) && jsonData.length > 0 && typeof jsonData[0] === 'object') {
        // Convert array of objects to CSV
        const headers = Object.keys(jsonData[0]);
        const csvLines = [
          headers.join(','),
          ...jsonData.map(obj => 
            headers.map(header => {
              const value = obj[header];
              // Escape commas and quotes in CSV
              if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value || '';
            }).join(',')
          )
        ];
        return new Blob([csvLines.join('\n')], { type: 'text/csv' });
      }
    }
    
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const csvData = XLSX.utils.sheet_to_csv(worksheet);
      return new Blob([csvData], { type: 'text/csv' });
    }
    
    // For other file types, create metadata CSV
    const csvData = [
      'Property,Value',
      `Filename,${file.name}`,
      `Type,${file.type}`,
      `Size,${file.size}`,
      `Size Formatted,${formatFileSize(file.size)}`,
      `Last Modified,${new Date(file.lastModified).toLocaleString()}`
    ].join('\n');
    
    return new Blob([csvData], { type: 'text/csv' });
  } catch (error) {
    console.error('Error converting to CSV:', error);
    const errorCsv = [
      'Error,Message',
      `Failed to convert ${file.name} to CSV,${error.message}`
    ].join('\n');
    return new Blob([errorCsv], { type: 'text/csv' });
  }
}

// Helper function to format file sizes
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
