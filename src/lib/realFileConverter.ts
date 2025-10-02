// Real file conversion library
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface ConversionResult {
  blob: Blob;
  filename: string;
  success: boolean;
  error?: string;
}

export class FileConverter {
  
  // Convert text to PDF
  static async textToPdf(file: File): Promise<ConversionResult> {
    try {
      const text = await file.text();
      const doc = new jsPDF();
      
      // Split text into lines that fit the page width
      const lines = doc.splitTextToSize(text, 180);
      
      // Add text to PDF with proper line breaks
      let y = 20;
      for (const line of lines) {
        if (y > 280) { // Start new page if needed
          doc.addPage();
          y = 20;
        }
        doc.text(line, 10, y);
        y += 10;
      }
      
      const pdfBlob = doc.output('blob');
      return {
        blob: pdfBlob,
        filename: `${file.name.split('.')[0]}.pdf`,
        success: true
      };
    } catch (error) {
      return {
        blob: new Blob(),
        filename: '',
        success: false,
        error: error instanceof Error ? error.message : 'PDF conversion failed'
      };
    }
  }

  // Convert CSV to JSON
  static async csvToJson(file: File): Promise<ConversionResult> {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV must have at least header and one data row');
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
      return {
        blob: new Blob(),
        filename: '',
        success: false,
        error: error instanceof Error ? error.message : 'CSV to JSON conversion failed'
      };
    }
  }

  // Convert JSON to CSV
  static async jsonToCsv(file: File): Promise<ConversionResult> {
    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      
      if (!Array.isArray(jsonData) || jsonData.length === 0) {
        throw new Error('JSON must be an array with at least one object');
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
      
      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv' });
      
      return {
        blob,
        filename: `${file.name.split('.')[0]}.csv`,
        success: true
      };
    } catch (error) {
      return {
        blob: new Blob(),
        filename: '',
        success: false,
        error: error instanceof Error ? error.message : 'JSON to CSV conversion failed'
      };
    }
  }

  // Convert CSV to Excel
  static async csvToExcel(file: File): Promise<ConversionResult> {
    try {
      const text = await file.text();
      const workbook = XLSX.read(text, { type: 'string' });
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      return {
        blob,
        filename: `${file.name.split('.')[0]}.xlsx`,
        success: true
      };
    } catch (error) {
      return {
        blob: new Blob(),
        filename: '',
        success: false,
        error: error instanceof Error ? error.message : 'CSV to Excel conversion failed'
      };
    }
  }

  // Convert Excel to CSV
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
      return {
        blob: new Blob(),
        filename: '',
        success: false,
        error: error instanceof Error ? error.message : 'Excel to CSV conversion failed'
      };
    }
  }

  // Convert any text file to TXT
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
      return {
        blob: new Blob(),
        filename: '',
        success: false,
        error: error instanceof Error ? error.message : 'Text conversion failed'
      };
    }
  }

  // Main conversion function
  static async convertFile(file: File, targetFormat: string): Promise<ConversionResult> {
    const sourceFormat = file.name.split('.').pop()?.toLowerCase() || '';
    
    console.log(`Converting ${sourceFormat} to ${targetFormat}`);
    
    try {
      switch (targetFormat) {
        case 'pdf':
          return await this.textToPdf(file);
        
        case 'json':
          if (sourceFormat === 'csv') {
            return await this.csvToJson(file);
          }
          throw new Error(`Cannot convert ${sourceFormat} to JSON`);
        
        case 'csv':
          if (sourceFormat === 'json') {
            return await this.jsonToCsv(file);
          } else if (['xlsx', 'xls'].includes(sourceFormat)) {
            return await this.excelToCsv(file);
          }
          throw new Error(`Cannot convert ${sourceFormat} to CSV`);
        
        case 'xlsx':
          if (sourceFormat === 'csv') {
            return await this.csvToExcel(file);
          }
          throw new Error(`Cannot convert ${sourceFormat} to Excel`);
        
        case 'txt':
          return await this.toText(file);
        
        default:
          throw new Error(`Unsupported target format: ${targetFormat}`);
      }
    } catch (error) {
      console.error('Conversion error:', error);
      return {
        blob: new Blob(),
        filename: '',
        success: false,
        error: error instanceof Error ? error.message : 'Conversion failed'
      };
    }
  }

  // Get supported conversions for a file type
  static getSupportedConversions(filename: string): string[] {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    
    const conversions: Record<string, string[]> = {
      'txt': ['pdf'],
      'csv': ['json', 'xlsx'],
      'json': ['csv'],
      'xlsx': ['csv'],
      'xls': ['csv'],
      'md': ['pdf', 'txt'],
      'html': ['pdf', 'txt']
    };
    
    return conversions[extension] || [];
  }
}

export default FileConverter;