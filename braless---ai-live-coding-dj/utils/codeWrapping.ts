/**
 * Inserts zero-width spaces at logical break points in code
 * This allows the browser to break lines at better locations
 * while preserving the actual code content
 */
export function insertCodeBreakOpportunities(code: string): string {
  // Use zero-width space (U+200B) to allow breaks without affecting code
  const ZWSP = '\u200B';
  
  let result = code;
  let inString = false;
  let stringChar = '';
  
  // Track string state to avoid breaking inside strings
  const processed: string[] = [];
  
  for (let i = 0; i < result.length; i++) {
    const char = result[i];
    const prevChar = i > 0 ? result[i - 1] : '';
    const nextChar = i < result.length - 1 ? result[i + 1] : '';
    
    // Track string boundaries
    if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
        stringChar = '';
      }
      processed.push(char);
      continue;
    }
    
    // Don't insert breaks inside strings
    if (inString) {
      processed.push(char);
      continue;
    }
    
    // Insert break opportunities at logical points:
    
    // 1. After closing parentheses followed by dot (method chaining)
    // Pattern: ).method() -> )ZWSP.method()
    if (char === ')' && nextChar === '.') {
      processed.push(char);
      processed.push(ZWSP);
      continue;
    }
    
    // 2. Before dots in method chains (when preceded by non-whitespace)
    // Pattern: word.method() -> wordZWSP.method()
    if (char === '.' && /\S/.test(prevChar)) {
      processed.push(ZWSP);
      processed.push(char);
      continue;
    }
    
    // 3. After closing parentheses (for method chaining)
    // Pattern: ).method() or )\n.method()
    if (char === ')' && (nextChar === '.' || /\s/.test(nextChar))) {
      processed.push(char);
      if (/\s/.test(nextChar)) {
        processed.push(ZWSP);
      }
      continue;
    }
    
    processed.push(char);
  }
  
  return processed.join('');
}

/**
 * Removes zero-width spaces from code (for actual code execution)
 */
export function removeCodeBreakOpportunities(code: string): string {
  return code.replace(/\u200B/g, '');
}

