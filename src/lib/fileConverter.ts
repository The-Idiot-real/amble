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
    const reader = new FileReader();
    
    reader.onload = async () => {
      try {
        let convertedData: string | Blob;
        
        switch (targetFormat.toLowerCase()) {
          case 'txt':
            convertedData = convertToText(file, reader.result as string);
            break;
          case 'pdf':
            convertedData = convertToPDF(file, reader.result as string);
            break;
          case 'jpg':
          case 'jpeg':
            convertedData = await convertToJPEG(file, reader.result as string, options);
            break;
          case 'png':
            convertedData = await convertToPNG(file, reader.result as string);
            break;
          case 'webp':
            convertedData = await convertToWebP(file, reader.result as string, options);
            break;
          default:
            convertedData = file;
        }
        
        const blob = typeof convertedData === 'string' 
          ? new Blob([convertedData], { type: getTargetMimeType(targetFormat) })
          : convertedData;
          
        resolve(blob);
      } catch (error) {
        reject(new Error(`Conversion failed: ${error}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    
    // Read file based on target format
    if (targetFormat.toLowerCase() === 'txt' || isTextFile(file)) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  });
};

const convertToText = (file: File, data: string): string => {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
    // For Word documents, extract text content
    return extractTextFromWord(data);
  } else if (fileName.endsWith('.pdf')) {
    // For PDFs, attempt basic text extraction
    return extractTextFromPDF(data);
  } else if (isTextFile(file)) {
    // Already text, return as is
    return data;
  } else {
    return `Text extraction from ${file.type} files is not supported. Original filename: ${file.name}`;
  }
};

const extractTextFromWord = (data: string): string => {
  try {
    // Basic extraction for demo - in production, use proper libraries
    const base64Data = data.split(',')[1];
    const binaryString = atob(base64Data);
    
    // Simple text extraction (this is very basic)
    let text = '';
    for (let i = 0; i < binaryString.length; i++) {
      const char = binaryString.charCodeAt(i);
      if (char >= 32 && char <= 126) {
        text += binaryString.charAt(i);
      }
    }
    
    // Clean up extracted text
    return text.replace(/[^\w\s.,!?;:'"()-]/g, '').replace(/\s+/g, ' ').trim();
  } catch (error) {
    return 'Error extracting text from Word document.';
  }
};

const extractTextFromPDF = (data: string): string => {
  // Basic PDF text extraction - in production, use pdf.js or similar
  return 'PDF text extraction requires additional libraries. This is a placeholder conversion.';
};

const convertToPDF = (file: File, data: string): Blob => {
  // Simple PDF generation (in production, use jsPDF or similar)
  const content = isTextFile(file) ? data : `Converted from: ${file.name}`;
  return new Blob([content], { type: 'application/pdf' });
};

const convertToJPEG = (file: File, data: string, options: ConversionOptions): Promise<Blob> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob(resolve!, 'image/jpeg', options.quality || 0.9);
    };
    img.src = data;
  });
};

const convertToPNG = (file: File, data: string): Promise<Blob> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob(resolve!, 'image/png');
    };
    img.src = data;
  });
};

const convertToWebP = (file: File, data: string, options: ConversionOptions): Promise<Blob> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob(resolve!, 'image/webp', options.quality || 0.8);
    };
    img.src = data;
  });
};

const isTextFile = (file: File): boolean => {
  return file.type.startsWith('text/') || 
         file.name.toLowerCase().endsWith('.txt') ||
         file.name.toLowerCase().endsWith('.csv') ||
         file.name.toLowerCase().endsWith('.json') ||
         file.name.toLowerCase().endsWith('.xml');
};

const getTargetMimeType = (format: string): string => {
  const mimeTypes: Record<string, string> = {
    'txt': 'text/plain',
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
    'json': 'application/json',
    'csv': 'text/csv',
    'xml': 'application/xml'
  };
  
  return mimeTypes[format.toLowerCase()] || 'application/octet-stream';
};