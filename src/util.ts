import  JSZip from 'jszip'
export function downloadFile(filename:string, content:string) {
  // Create a blob with the content
  const blob = new Blob([content], { type: 'text/plain' });
  
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Create a temporary anchor element
  const link = document.createElement('a');
  
  // Set the download attributes
  link.href = url;
  link.download = filename;
  
  // Append to the document temporarily
  document.body.appendChild(link);
  
  // Trigger the download
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}


/**
 * Performs placeholder substitution in a template string using values from a dictionary
 * Placeholders are in the format #{object.property}
 * 
 * @param template - The template string containing placeholders
 * @param dictionary - An object containing values for substitution
 * @returns The template with all placeholders replaced by their corresponding values
 */
export function templatize(template: string, dictionary: Record<string, any>): string {
    // Regular expression to match placeholders like #{ums.ip}
    const placeholderRegex = /#{([^}]+)}/g;
    
    return template.replace(placeholderRegex, (match, path) => {
      // Split the path into parts (e.g., "ums.ip" -> ["ums", "ip"])
      const parts = path.split('.');
      
      // Start with the dictionary
      let value: any = dictionary;
      
      // Navigate through the parts to get the nested value
      for (const part of parts) {
        if (value === undefined || value === null || !(part in value)) {
          // If any part of the path is invalid, return the original placeholder
          return "";
        }
        value = value[part];
      }
      
      // Convert the value to string for substitution
      return value !== undefined && value !== null ? String(value) : "";
    });
  }
  

  export interface IFile {
    content: string;
    name: string;
  }

export  async function downloadZipFile(files:IFile[], zipFileName = 'files.zip') {
  // Import JSZip library (make sure to include it in your HTML)
  // <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
  
  if (typeof JSZip === 'undefined') {
    throw new Error('JSZip library is required. Include it with: <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>');
  }

  try {
    // Create a new JSZip instance
    const zip = new JSZip();
    
    // Add each file to the zip
    files.forEach(file => {
      if (!file.name || !file.content) {
        console.warn('Skipping file with missing name or content:', file);
        return;
      }
      zip.file(file.name, file.content);
    });
    
    // Generate the zip file as a blob
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    // Create download link and trigger download
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = zipFileName;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log(`Successfully downloaded ${zipFileName} containing ${files.length} files`);
  } catch (error) {
    console.error('Error creating zip file:', error);
    throw error;
  }
}