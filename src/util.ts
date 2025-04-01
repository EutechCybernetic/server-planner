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
  