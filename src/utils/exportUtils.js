import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

/**
 * Escapes values and converts headers and rows to a properly formatted Excel-friendly CSV.
 * Appends UTF-8 BOM so Excel opens special characters (like currency symbols) correctly.
 */
export function convertToCSV(headers, rows) {
  const escapeField = (val) => {
    if (val === null || val === undefined) return '';
    let str = String(val);
    // If the string contains double quotes, commas, or newlines, escape it
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
      str = '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const csvRows = [];
  csvRows.push(headers.map(escapeField).join(','));
  rows.forEach(row => {
    csvRows.push(row.map(escapeField).join(','));
  });

  // \uFEFF is the UTF-8 Byte Order Mark (BOM) which tells Excel this is UTF-8 encoded
  return '\uFEFF' + csvRows.join('\r\n');
}

/**
 * Saves and exports a CSV file.
 * If running on a native Capacitor platform, it writes to Cache storage and triggers
 * the native Share dialog (allowing Save to Files, WhatsApp, etc.).
 * If running in a web browser, it falls back to a standard web download link.
 */
export async function exportFile(filename, csvData) {
  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    try {
      // 1. Write the file to Cache directory (highly compatible, requires no permissions, can share immediately)
      const writeResult = await Filesystem.writeFile({
        path: filename,
        data: csvData,
        directory: Directory.Cache,
        encoding: 'utf8'
      });

      // 2. Open the native Share dialog to let the user save to their filesystem or share it
      await Share.share({
        title: 'Export Excel/CSV file',
        text: `Galaxy Dairy export: ${filename}`,
        url: writeResult.uri,
        dialogTitle: 'Download or Share Excel/CSV'
      });

      return { success: true, native: true, uri: writeResult.uri };
    } catch (err) {
      console.error('Capacitor native export failed, trying web fallback:', err);
      return triggerWebDownload(filename, csvData);
    }
  } else {
    return triggerWebDownload(filename, csvData);
  }
}

function triggerWebDownload(filename, csvData) {
  try {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return { success: true, native: false };
  } catch (err) {
    console.error('Web download failed:', err);
    return { success: false, error: err };
  }
}
