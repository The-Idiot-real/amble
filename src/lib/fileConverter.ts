import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import jsPDF from 'jspdf';

export interface ConversionOptions {
  quality?: number;
  compression?: boolean;
}

export const convertFile = async (
  file: File, 
  targetFormat: string, 
  options: ConversionOptions = {}
): Promise<Blob> => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(`Converting ${file.name} (${file.type}) to ${targetFormat}`);
      
      let convertedData: Blob;
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      
      switch (targetFormat.toLowerCase()) {
        case 'txt':
          convertedData = await convertToText(file);
          break;
        case 'pdf':
          convertedData = await convertToPDF(file);
          break;
        case 'jpg':
        case 'jpeg':
          convertedData = await convertToJPEG(file, options);
          break;
        case 'png':
          convertedData = await convertToPNG(file);
          break;
        case 'webp':
          convertedData = await convertToWebP(file, options);
          break;
        case 'json':
          convertedData = await convertToJSON(file);
          break;
        case 'csv':
          convertedData = await convertToCSV(file);
          break;
        default:
          // If no specific conversion is available, return the original file
          convertedData = file;
      }
      
      console.log(`Conversion completed: ${convertedData.size} bytes`);
      resolve(convertedData);
    } catch (error) {
      console.error('Conversion failed:', error);
      reject(new Error(`Conversion failed: ${error}`));
    }
  });
};

const convertToText = async (file: File): Promise<Blob> => {
  const fileName = file.name.toLowerCase();
  
  if (file.type.startsWith('text/') || fileName.endsWith('.txt')) {
    // Already text, return as is
    return new Blob([await file.text()], { type: 'text/plain' });
  } else if (fileName.endsWith('.json')) {
    // JSON to readable text
    try {
      const jsonContent = JSON.parse(await file.text());
      const textContent = JSON.stringify(jsonContent, null, 2);
      return new Blob([textContent], { type: 'text/plain' });
    } catch (error) {
      return new Blob([await file.text()], { type: 'text/plain' });
    }
  } else if (fileName.endsWith('.csv')) {
    // CSV is already text-readable
    return new Blob([await file.text()], { type: 'text/plain' });
  } else if (file.type.startsWith('image/')) {
    // For images, create a text description
    const textContent = `Image File: ${file.name}\nType: ${file.type}\nSize: ${formatFileSize(file.size)}\nCreated: ${new Date().toISOString()}\n\nThis is a converted image file. The original image cannot be displayed as text.\nTo view the actual image content, please use an image viewer or convert to an image format.`;
    return new Blob([textContent], { type: 'text/plain' });
  } else {
    // For other file types, create a basic text representation
    const textContent = `File: ${file.name}\nType: ${file.type}\nSize: ${formatFileSize(file.size)}\nCreated: ${new Date().toISOString()}\n\nThis file has been converted to text format. The original content may not be fully representable as plain text.`;
    return new Blob([textContent], { type: 'text/plain' });
  }
};

const convertToPDF = async (file: File): Promise<Blob> => {
  const doc = new jsPDF();
  const fileName = file.name.toLowerCase();
  
  if (file.type.startsWith('text/') || fileName.endsWith('.txt') || fileName.endsWith('.json') || fileName.endsWith('.csv')) {
    // Text to PDF
    const text = await file.text();
    const lines = text.split('\n');
    
    doc.setFontSize(12);
    let y = 20;
    
    for (const line of lines) {
      if (y > 280) { // Page break
        doc.addPage();
        y = 20;
      }
      
      // Handle long lines by wrapping
      const maxWidth = 180;
      const wrappedLines = doc.splitTextToSize(line, maxWidth);
      
      for (const wrappedLine of wrappedLines) {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(wrappedLine, 10, y);
        y += 7;
      }
    }
  } else if (file.type.startsWith('image/')) {
    // Image to PDF
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        // Calculate dimensions to fit PDF page
        const pdfWidth = 210; // A4 width in mm
        const pdfHeight = 297; // A4 height in mm
        const maxWidth = pdfWidth - 20; // margins
        const maxHeight = pdfHeight - 20;
        
        let { width, height } = img;
        
        // Scale to fit
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        doc.addImage(imageData, 'JPEG', 10, 10, width, height);
        
        resolve(new Blob([doc.output('blob')], { type: 'application/pdf' }));
      };
      
      const reader = new FileReader();
      reader.onload = () => img.src = reader.result as string;
      reader.readAsDataURL(file);
    });
  } else {
    // For other file types, create a simple PDF with file info
    doc.setFontSize(16);
    doc.text('File Conversion Report', 10, 20);
    
    doc.setFontSize(12);
    doc.text(`Original File: ${file.name}`, 10, 40);
    doc.text(`File Type: ${file.type}`, 10, 50);
    doc.text(`File Size: ${formatFileSize(file.size)}`, 10, 60);
    doc.text(`Converted: ${new Date().toLocaleDateString()}`, 10, 70);
    
    doc.text('Note: This file type cannot be directly converted to PDF.', 10, 90);
    doc.text('This PDF contains metadata about the original file.', 10, 100);
  }
  
  return new Blob([doc.output('blob')], { type: 'application/pdf' });
};

const convertToJPEG = (file: File, options: ConversionOptions): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File must be an image to convert to JPEG'));
      return;
    }
    
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Fill with white background for transparency
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert image to JPEG'));
          }
        },
        'image/jpeg',
        options.quality || 0.9
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    
    const reader = new FileReader();
    reader.onload = () => img.src = reader.result as string;
    reader.readAsDataURL(file);
  });
};

const convertToPNG = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File must be an image to convert to PNG'));
      return;
    }
    
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
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
    
    const reader = new FileReader();
    reader.onload = () => img.src = reader.result as string;
    reader.readAsDataURL(file);
  });
};

const convertToWebP = (file: File, options: ConversionOptions): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File must be an image to convert to WebP'));
      return;
    }
    
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
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
    
    const reader = new FileReader();
    reader.onload = () => img.src = reader.result as string;
    reader.readAsDataURL(file);
  });
};

const convertToJSON = async (file: File): Promise<Blob> => {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.json')) {
    // Already JSON, validate and format
    try {
      const jsonText = await file.text();
      const parsed = JSON.parse(jsonText);
      const formatted = JSON.stringify(parsed, null, 2);
      return new Blob([formatted], { type: 'application/json' });
    } catch (error) {
      throw new Error('Invalid JSON file');
    }
  } else if (fileName.endsWith('.csv')) {
    // CSV to JSON
    const csvText = await file.text();
    const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);
    
    if (lines.length === 0) {
      throw new Error('Empty CSV file');
    }
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });
    
    const jsonString = JSON.stringify(data, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  } else if (file.type.startsWith('text/')) {
    // Text to JSON
    const text = await file.text();
    const jsonData = {
      originalFile: file.name,
      content: text,
      convertedAt: new Date().toISOString(),
      fileSize: file.size,
      fileType: file.type
    };
    
    const jsonString = JSON.stringify(jsonData, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  } else {
    // Other file types to JSON metadata
    const jsonData = {
      originalFile: file.name,
      fileSize: file.size,
      fileType: file.type,
      convertedAt: new Date().toISOString(),
      note: 'Binary file converted to JSON metadata format'
    };
    
    const jsonString = JSON.stringify(jsonData, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  }
};

const convertToCSV = async (file: File): Promise<Blob> => {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.csv')) {
    // Already CSV, return as is
    return new Blob([await file.text()], { type: 'text/csv' });
  } else if (fileName.endsWith('.json')) {
    // JSON to CSV
    try {
      const jsonText = await file.text();
      const data = JSON.parse(jsonText);
      
      if (!Array.isArray(data)) {
        throw new Error('JSON must be an array of objects to convert to CSV');
      }
      
      if (data.length === 0) {
        return new Blob([''], { type: 'text/csv' });
      }
      
      // Get all unique keys from all objects
      const allKeys = new Set<string>();
      data.forEach(obj => {
        if (typeof obj === 'object' && obj !== null) {
          Object.keys(obj).forEach(key => allKeys.add(key));
        }
      });
      
      const headers = Array.from(allKeys);
      const csvLines = [headers.join(',')];
      
      data.forEach(obj => {
        if (typeof obj === 'object' && obj !== null) {
          const values = headers.map(header => {
            const value = obj[header];
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            // Escape commas and quotes
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          });
          csvLines.push(values.join(','));
        }
      });
      
      const csvContent = csvLines.join('\n');
      return new Blob([csvContent], { type: 'text/csv' });
    } catch (error) {
      throw new Error('Invalid JSON format for CSV conversion');
    }
  } else {
    // Other file types to CSV metadata
    const csvContent = `Field,Value\nOriginal File,${file.name}\nFile Type,${file.type}\nFile Size,${file.size}\nConverted At,${new Date().toISOString()}`;
    
    return new Blob([csvContent], { type: 'text/csv' });
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
