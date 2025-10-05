// Enhanced file conversion library with extensive format support
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { marked } from 'marked';
import html2canvas from 'html2canvas';

export interface ConversionResult {
  blob: Blob;
  filename: string;
  success: boolean;
  error?: string;
}

export class EnhancedFileConverter {
  
  // ============= PDF CONVERSIONS =============
  
  // Text/Markdown/HTML to PDF
  static async textToPdf(file: File): Promise<ConversionResult> {
    try {
      const text = await file.text();
      const doc = new jsPDF();
      const lines = doc.splitTextToSize(text, 180);
      
      let y = 20;
      for (const line of lines) {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 10, y);
        y += 7;
      }
      
      return {
        blob: doc.output('blob'),
        filename: `${file.name.split('.')[0]}.pdf`,
        success: true
      };
    } catch (error) {
      return this.errorResult(error, 'PDF conversion failed');
    }
  }

  static async markdownToPdf(file: File): Promise<ConversionResult> {
    try {
      const markdown = await file.text();
      const htmlStr = String(await marked(markdown));
      const doc = new jsPDF();
      
      // Convert HTML to plain text for PDF (simplified)
      const text = htmlStr.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
      const lines = doc.splitTextToSize(text, 180);
      
      let y = 20;
      for (const line of lines) {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 10, y);
        y += 7;
      }
      
      return {
        blob: doc.output('blob'),
        filename: `${file.name.split('.')[0]}.pdf`,
        success: true
      };
    } catch (error) {
      return this.errorResult(error, 'Markdown to PDF failed');
    }
  }

  // Image to PDF
  static async imageToPdf(file: File): Promise<ConversionResult> {
    try {
      const imageUrl = await this.fileToDataURL(file);
      const doc = new jsPDF();
      const img = new Image();
      
      return new Promise((resolve) => {
        img.onload = () => {
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
          const imgWidth = img.width;
          const imgHeight = img.height;
          
          // Calculate dimensions to fit page
          const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
          const w = imgWidth * ratio;
          const h = imgHeight * ratio;
          
          doc.addImage(imageUrl, 'JPEG', 10, 10, w - 20, h - 20);
          
          resolve({
            blob: doc.output('blob'),
            filename: `${file.name.split('.')[0]}.pdf`,
            success: true
          });
        };
        img.src = imageUrl;
      });
    } catch (error) {
      return this.errorResult(error, 'Image to PDF failed');
    }
  }

  // ============= CSV/JSON/EXCEL CONVERSIONS =============
  
  static async csvToJson(file: File): Promise<ConversionResult> {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV must have header and data rows');
      }
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const jsonData = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        return obj;
      });
      
      const jsonString = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      return {
        blob,
        filename: `${file.name.split('.')[0]}.json`,
        success: true
      };
    } catch (error) {
      return this.errorResult(error, 'CSV to JSON failed');
    }
  }

  static async jsonToCsv(file: File): Promise<ConversionResult> {
    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      
      if (!Array.isArray(jsonData) || jsonData.length === 0) {
        throw new Error('JSON must be an array with objects');
      }
      
      const headers = Object.keys(jsonData[0]);
      const csvRows = [headers.join(',')];
      
      for (const row of jsonData) {
        const values = headers.map(header => {
          const value = row[header] || '';
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        });
        csvRows.push(values.join(','));
      }
      
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      
      return {
        blob,
        filename: `${file.name.split('.')[0]}.csv`,
        success: true
      };
    } catch (error) {
      return this.errorResult(error, 'JSON to CSV failed');
    }
  }

  static async csvToExcel(file: File): Promise<ConversionResult> {
    try {
      const text = await file.text();
      const workbook = XLSX.read(text, { type: 'string' });
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      return {
        blob,
        filename: `${file.name.split('.')[0]}.xlsx`,
        success: true
      };
    } catch (error) {
      return this.errorResult(error, 'CSV to Excel failed');
    }
  }

  static async excelToCsv(file: File): Promise<ConversionResult> {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      const csvString = XLSX.utils.sheet_to_csv(worksheet);
      
      const blob = new Blob([csvString], { type: 'text/csv' });
      
      return {
        blob,
        filename: `${file.name.split('.')[0]}.csv`,
        success: true
      };
    } catch (error) {
      return this.errorResult(error, 'Excel to CSV failed');
    }
  }

  static async excelToJson(file: File): Promise<ConversionResult> {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      
      return {
        blob,
        filename: `${file.name.split('.')[0]}.json`,
        success: true
      };
    } catch (error) {
      return this.errorResult(error, 'Excel to JSON failed');
    }
  }

  static async jsonToExcel(file: File): Promise<ConversionResult> {
    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      
      const worksheet = XLSX.utils.json_to_sheet(jsonData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      return {
        blob,
        filename: `${file.name.split('.')[0]}.xlsx`,
        success: true
      };
    } catch (error) {
      return this.errorResult(error, 'JSON to Excel failed');
    }
  }

  // ============= TEXT CONVERSIONS =============
  
  static async toText(file: File): Promise<ConversionResult> {
    try {
      const text = await file.text();
      const blob = new Blob([text], { type: 'text/plain' });
      
      return {
        blob,
        filename: `${file.name.split('.')[0]}.txt`,
        success: true
      };
    } catch (error) {
      return this.errorResult(error, 'Text conversion failed');
    }
  }

  static async markdownToHtml(file: File): Promise<ConversionResult> {
    try {
      const markdown = await file.text();
      const htmlContent = String(await marked(markdown));
      const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${file.name}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
    pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>`;
      
      const blob = new Blob([fullHtml], { type: 'text/html' });
      
      return {
        blob,
        filename: `${file.name.split('.')[0]}.html`,
        success: true
      };
    } catch (error) {
      return this.errorResult(error, 'Markdown to HTML failed');
    }
  }

  static async htmlToText(file: File): Promise<ConversionResult> {
    try {
      const html = await file.text();
      const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const blob = new Blob([text], { type: 'text/plain' });
      
      return {
        blob,
        filename: `${file.name.split('.')[0]}.txt`,
        success: true
      };
    } catch (error) {
      return this.errorResult(error, 'HTML to Text failed');
    }
  }

  // ============= IMAGE CONVERSIONS =============
  
  static async convertImageFormat(file: File, targetFormat: string): Promise<ConversionResult> {
    try {
      const imageUrl = await this.fileToDataURL(file);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      return new Promise((resolve) => {
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          
          const mimeType = `image/${targetFormat}`;
          canvas.toBlob((blob) => {
            if (blob) {
              resolve({
                blob,
                filename: `${file.name.split('.')[0]}.${targetFormat}`,
                success: true
              });
            } else {
              resolve(this.errorResult(new Error('Canvas conversion failed'), 'Image conversion failed'));
            }
          }, mimeType, 0.95);
        };
        img.src = imageUrl;
      });
    } catch (error) {
      return this.errorResult(error, 'Image conversion failed');
    }
  }

  // ============= HELPER METHODS =============
  
  private static fileToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private static errorResult(error: any, defaultMessage: string): ConversionResult {
    console.error('Conversion error:', error);
    return {
      blob: new Blob(),
      filename: '',
      success: false,
      error: error instanceof Error ? error.message : defaultMessage
    };
  }

  // ============= MAIN CONVERSION FUNCTION =============
  
  static async convertFile(file: File, targetFormat: string): Promise<ConversionResult> {
    const sourceFormat = file.name.split('.').pop()?.toLowerCase() || '';
    
    console.log(`Converting ${sourceFormat} to ${targetFormat}`);
    
    try {
      // PDF conversions
      if (targetFormat === 'pdf') {
        if (['txt', 'log', 'csv', 'json'].includes(sourceFormat)) {
          return await this.textToPdf(file);
        }
        if (sourceFormat === 'md') {
          return await this.markdownToPdf(file);
        }
        if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(sourceFormat)) {
          return await this.imageToPdf(file);
        }
      }
      
      // JSON conversions
      if (targetFormat === 'json') {
        if (sourceFormat === 'csv') return await this.csvToJson(file);
        if (['xlsx', 'xls'].includes(sourceFormat)) return await this.excelToJson(file);
      }
      
      // CSV conversions
      if (targetFormat === 'csv') {
        if (sourceFormat === 'json') return await this.jsonToCsv(file);
        if (['xlsx', 'xls'].includes(sourceFormat)) return await this.excelToCsv(file);
      }
      
      // Excel conversions
      if (targetFormat === 'xlsx') {
        if (sourceFormat === 'csv') return await this.csvToExcel(file);
        if (sourceFormat === 'json') return await this.jsonToExcel(file);
      }
      
      // Text conversions
      if (targetFormat === 'txt') {
        if (sourceFormat === 'html') return await this.htmlToText(file);
        return await this.toText(file);
      }
      
      // HTML conversions
      if (targetFormat === 'html') {
        if (sourceFormat === 'md') return await this.markdownToHtml(file);
      }
      
      // Image conversions
      if (['jpg', 'jpeg', 'png', 'webp'].includes(targetFormat)) {
        if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(sourceFormat)) {
          return await this.convertImageFormat(file, targetFormat);
        }
      }
      
      throw new Error(`Unsupported conversion: ${sourceFormat} to ${targetFormat}`);
      
    } catch (error) {
      return this.errorResult(error, 'Conversion failed');
    }
  }

  // Get supported conversions for a file type
  static getSupportedConversions(filename: string): string[] {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    
    const conversions: Record<string, string[]> = {
      // Text formats
      'txt': ['pdf'],
      'md': ['pdf', 'html', 'txt'],
      'html': ['pdf', 'txt'],
      'log': ['pdf', 'txt'],
      
      // Data formats
      'csv': ['json', 'xlsx', 'pdf', 'txt'],
      'json': ['csv', 'xlsx', 'txt'],
      'xlsx': ['csv', 'json', 'txt'],
      'xls': ['csv', 'json', 'txt'],
      
      // Image formats
      'jpg': ['pdf', 'png', 'webp'],
      'jpeg': ['pdf', 'png', 'webp'],
      'png': ['pdf', 'jpg', 'webp'],
      'webp': ['pdf', 'jpg', 'png'],
      'gif': ['pdf', 'jpg', 'png'],
      'bmp': ['pdf', 'jpg', 'png'],
    };
    
    return conversions[extension] || [];
  }
}

export default EnhancedFileConverter;
