export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber: number;
}

export interface DiffResult {
  lines: DiffLine[];
  addedCount: number;
  removedCount: number;
}

export interface DiffSegment {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
  startIndex: number;
  endIndex: number;
}

export interface InlineDiffLine {
  lineNumber: number;
  segments: DiffSegment[];
  originalLine: string;
  newLine: string;
}

/**
 * Simple line-based diff algorithm
 * Returns an array of DiffLine objects representing the differences
 */
export function computeDiff(oldCode: string, newCode: string): DiffResult {
  const oldLines = oldCode.split('\n');
  const newLines = newCode.split('\n');
  
  const result: DiffLine[] = [];
  let addedCount = 0;
  let removedCount = 0;
  
  // Create a map of old line indices to new line indices
  // This is a simplified longest common subsequence approach
  const maxLength = Math.max(oldLines.length, newLines.length);
  
  let oldIndex = 0;
  let newIndex = 0;
  
  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    if (oldIndex >= oldLines.length) {
      // Only new lines remain
      result.push({
        type: 'added',
        content: newLines[newIndex],
        lineNumber: newIndex + 1
      });
      addedCount++;
      newIndex++;
    } else if (newIndex >= newLines.length) {
      // Only old lines remain
      result.push({
        type: 'removed',
        content: oldLines[oldIndex],
        lineNumber: oldIndex + 1
      });
      removedCount++;
      oldIndex++;
    } else if (oldLines[oldIndex] === newLines[newIndex]) {
      // Lines match
      result.push({
        type: 'unchanged',
        content: oldLines[oldIndex],
        lineNumber: oldIndex + 1
      });
      oldIndex++;
      newIndex++;
    } else {
      // Lines differ - check if this is an addition or removal
      // Look ahead to see if we can find a match
      let foundMatch = false;
      let lookAhead = 1;
      
      // Check if the next old line matches the current new line (addition)
      if (oldIndex + lookAhead < oldLines.length && oldLines[oldIndex + lookAhead] === newLines[newIndex]) {
        result.push({
          type: 'removed',
          content: oldLines[oldIndex],
          lineNumber: oldIndex + 1
        });
        removedCount++;
        oldIndex++;
        foundMatch = true;
      }
      
      // Check if the current old line matches the next new line (removal)
      if (!foundMatch && newIndex + lookAhead < newLines.length && oldLines[oldIndex] === newLines[newIndex + lookAhead]) {
        result.push({
          type: 'added',
          content: newLines[newIndex],
          lineNumber: newIndex + 1
        });
        addedCount++;
        newIndex++;
        foundMatch = true;
      }
      
      // If no match found, treat as both removed and added
      if (!foundMatch) {
        result.push({
          type: 'removed',
          content: oldLines[oldIndex],
          lineNumber: oldIndex + 1
        });
        removedCount++;
        oldIndex++;
        
        result.push({
          type: 'added',
          content: newLines[newIndex],
          lineNumber: newIndex + 1
        });
        addedCount++;
        newIndex++;
      }
    }
  }
  
  return {
    lines: result,
    addedCount,
    removedCount
  };
}

/**
 * Get ranges of consecutive changed lines for highlighting
 */
export interface ChangeRange {
  start: number;
  end: number;
  type: 'added' | 'removed';
}

export function getChangeRanges(diff: DiffResult): ChangeRange[] {
  const ranges: ChangeRange[] = [];
  let currentRange: ChangeRange | null = null;
  
  diff.lines.forEach((line, index) => {
    if (line.type === 'added' || line.type === 'removed') {
      if (currentRange && currentRange.type === line.type) {
        // Extend current range
        currentRange.end = index;
      } else {
        // Start new range
        if (currentRange) {
          ranges.push(currentRange);
        }
        currentRange = {
          start: index,
          end: index,
          type: line.type
        };
      }
    } else {
      // Unchanged line - close current range if exists
      if (currentRange) {
        ranges.push(currentRange);
        currentRange = null;
      }
    }
  });
  
  if (currentRange) {
    ranges.push(currentRange);
  }
  
  return ranges;
}

/**
 * Compute character-level inline diff for a single line
 * Uses a word-based approach for better granularity
 */
function computeInlineDiff(oldLine: string, newLine: string): DiffSegment[] {
  const segments: DiffSegment[] = [];
  
  // If lines are identical, return single unchanged segment
  if (oldLine === newLine) {
    return [{
      type: 'unchanged',
      text: oldLine,
      startIndex: 0,
      endIndex: oldLine.length
    }];
  }
  
  // Split into words (preserving whitespace)
  // This regex splits on word boundaries but keeps the delimiters
  const oldWords: string[] = [];
  const newWords: string[] = [];
  
  // Simple word splitting - split on whitespace but keep it
  let oldWord = '';
  for (let i = 0; i < oldLine.length; i++) {
    const char = oldLine[i];
    if (/\s/.test(char)) {
      if (oldWord) {
        oldWords.push(oldWord);
        oldWord = '';
      }
      oldWords.push(char);
    } else {
      oldWord += char;
    }
  }
  if (oldWord) oldWords.push(oldWord);
  
  let newWord = '';
  for (let i = 0; i < newLine.length; i++) {
    const char = newLine[i];
    if (/\s/.test(char)) {
      if (newWord) {
        newWords.push(newWord);
        newWord = '';
      }
      newWords.push(char);
    } else {
      newWord += char;
    }
  }
  if (newWord) newWords.push(newWord);
  
  // Simple diff: compare word by word
  let oldIdx = 0;
  let newIdx = 0;
  let charPos = 0;
  
  while (oldIdx < oldWords.length || newIdx < newWords.length) {
    if (oldIdx >= oldWords.length) {
      // Only new words remain
      const text = newWords.slice(newIdx).join('');
      if (text.length > 0) {
        segments.push({
          type: 'added',
          text,
          startIndex: charPos,
          endIndex: charPos + text.length
        });
      }
      break;
    } else if (newIdx >= newWords.length) {
      // Only old words remain
      const text = oldWords.slice(oldIdx).join('');
      if (text.length > 0) {
        segments.push({
          type: 'removed',
          text,
          startIndex: charPos,
          endIndex: charPos + text.length
        });
      }
      break;
    } else if (oldWords[oldIdx] === newWords[newIdx]) {
      // Words match
      const text = oldWords[oldIdx];
      segments.push({
        type: 'unchanged',
        text,
        startIndex: charPos,
        endIndex: charPos + text.length
      });
      charPos += text.length;
      oldIdx++;
      newIdx++;
    } else {
      // Words differ - look ahead for a match
      let foundMatch = false;
      
      // Check if next old word matches current new word (removal)
      if (oldIdx + 1 < oldWords.length && oldWords[oldIdx + 1] === newWords[newIdx]) {
        const text = oldWords[oldIdx];
        segments.push({
          type: 'removed',
          text,
          startIndex: charPos,
          endIndex: charPos + text.length
        });
        charPos += text.length;
        oldIdx++;
        foundMatch = true;
      }
      
      // Check if current old word matches next new word (addition)
      if (!foundMatch && newIdx + 1 < newWords.length && oldWords[oldIdx] === newWords[newIdx + 1]) {
        const text = newWords[newIdx];
        segments.push({
          type: 'added',
          text,
          startIndex: charPos,
          endIndex: charPos + text.length
        });
        charPos += text.length;
        newIdx++;
        foundMatch = true;
      }
      
      // If no match found, mark both as changed
      if (!foundMatch) {
        const oldText = oldWords[oldIdx];
        const newText = newWords[newIdx];
        
        if (oldText.length > 0) {
          segments.push({
            type: 'removed',
            text: oldText,
            startIndex: charPos,
            endIndex: charPos + oldText.length
          });
          charPos += oldText.length;
        }
        
        if (newText.length > 0) {
          segments.push({
            type: 'added',
            text: newText,
            startIndex: charPos,
            endIndex: charPos + newText.length
          });
          charPos += newText.length;
        }
        
        oldIdx++;
        newIdx++;
      }
    }
  }
  
  // If no segments, return empty unchanged segment
  if (segments.length === 0) {
    return [{
      type: 'unchanged',
      text: '',
      startIndex: 0,
      endIndex: 0
    }];
  }
  
  return segments;
}

/**
 * Compute inline diff that preserves line structure
 * Returns an array of InlineDiffLine objects, one per line in the new code
 */
export function computeInlineDiffResult(oldCode: string, newCode: string): InlineDiffLine[] {
  const oldLines = oldCode.split('\n');
  const newLines = newCode.split('\n');
  const result: InlineDiffLine[] = [];
  
  const maxLines = Math.max(oldLines.length, newLines.length);
  
  for (let i = 0; i < maxLines; i++) {
    const oldLine = i < oldLines.length ? oldLines[i] : '';
    const newLine = i < newLines.length ? newLines[i] : '';
    
    if (oldLine === newLine) {
      // Lines are identical
      result.push({
        lineNumber: i + 1,
        segments: [{
          type: 'unchanged',
          text: newLine,
          startIndex: 0,
          endIndex: newLine.length
        }],
        originalLine: oldLine,
        newLine: newLine
      });
    } else {
      // Lines differ - compute inline diff
      const rawSegments = computeInlineDiff(oldLine, newLine);
      
      // Rebuild segments to match newLine character positions exactly
      const segments: DiffSegment[] = [];
      let newLinePos = 0;
      
      for (const seg of rawSegments) {
        if (seg.type === 'unchanged' || seg.type === 'added') {
          // These segments appear in the new line
          const endPos = newLinePos + seg.text.length;
          segments.push({
            type: seg.type,
            text: seg.text,
            startIndex: newLinePos,
            endIndex: endPos
          });
          newLinePos = endPos;
        } else if (seg.type === 'removed') {
          // Removed segments don't appear in new line, but we show them for context
          // Insert them at current position
          segments.push({
            type: 'removed',
            text: seg.text,
            startIndex: newLinePos,
            endIndex: newLinePos
          });
          // Don't advance newLinePos for removed text
        }
      }
      
      result.push({
        lineNumber: i + 1,
        segments,
        originalLine: oldLine,
        newLine: newLine
      });
    }
  }
  
  return result;
}

