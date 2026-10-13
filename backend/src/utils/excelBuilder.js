const zlib = require('zlib');

/**
 * Escapes XML special characters.
 */
function xmlEscape(val) {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Converts a 0-based column index to an Excel column name (e.g. 0 -> A, 27 -> AB).
 */
function getColumnName(colIndex) {
  let colName = '';
  let index = colIndex;
  while (index >= 0) {
    colName = String.fromCharCode((index % 26) + 65) + colName;
    index = Math.floor(index / 26) - 1;
  }
  return colName;
}

// Pre-computed CRC32 lookup table
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c;
}

function computeCRC32(buffer) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buffer.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buffer[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

/**
 * Packs files into an in-memory ZIP buffer without any external dependencies.
 */
function createZipArchive(files) {
  const fileEntries = [];
  let currentOffset = 0;
  const parts = [];

  const dosTime = 0x6000; // 12:00:00
  const dosDate = 0x5821; // 2024-01-01

  for (const file of files) {
    const rawData = Buffer.from(file.content, 'utf8');
    const compressedData = zlib.deflateRawSync(rawData);
    // Use compression if it yields a smaller size
    const useCompression = compressedData.length < rawData.length;
    const finalData = useCompression ? compressedData : rawData;
    const method = useCompression ? 8 : 0;
    const crc = computeCRC32(rawData);
    const pathBuf = Buffer.from(file.path, 'utf8');

    // Local file header (30 bytes + filename)
    const localHeader = Buffer.alloc(30 + pathBuf.length);
    localHeader.writeUInt32LE(0x04034b50, 0); // signature
    localHeader.writeUInt16LE(20, 4);         // version needed to extract
    localHeader.writeUInt16LE(0, 6);          // general purpose bit flag
    localHeader.writeUInt16LE(method, 8);     // compression method
    localHeader.writeUInt16LE(dosTime, 10);   // last mod file time
    localHeader.writeUInt16LE(dosDate, 12);   // last mod file date
    localHeader.writeUInt32LE(crc, 14);       // crc-32
    localHeader.writeUInt32LE(finalData.length, 18); // compressed size
    localHeader.writeUInt32LE(rawData.length, 22);   // uncompressed size
    localHeader.writeUInt16LE(pathBuf.length, 26);   // file name length
    localHeader.writeUInt16LE(0, 28);         // extra field length
    pathBuf.copy(localHeader, 30);

    parts.push(localHeader, finalData);

    fileEntries.push({
      pathBuf,
      method,
      crc,
      compSize: finalData.length,
      uncompSize: rawData.length,
      offset: currentOffset,
      dosTime,
      dosDate,
    });

    currentOffset += localHeader.length + finalData.length;
  }

  const centralDirStartOffset = currentOffset;
  for (const entry of fileEntries) {
    // Central directory header (46 bytes + filename)
    const cdHeader = Buffer.alloc(46 + entry.pathBuf.length);
    cdHeader.writeUInt32LE(0x02014b50, 0);       // signature
    cdHeader.writeUInt16LE(20, 4);               // version made by
    cdHeader.writeUInt16LE(20, 6);               // version needed to extract
    cdHeader.writeUInt16LE(0, 8);                // general purpose bit flag
    cdHeader.writeUInt16LE(entry.method, 10);    // compression method
    cdHeader.writeUInt16LE(entry.dosTime, 12);   // last mod file time
    cdHeader.writeUInt16LE(entry.dosDate, 14);   // last mod file date
    cdHeader.writeUInt32LE(entry.crc, 16);       // crc-32
    cdHeader.writeUInt32LE(entry.compSize, 20);  // compressed size
    cdHeader.writeUInt32LE(entry.uncompSize, 24);// uncompressed size
    cdHeader.writeUInt16LE(entry.pathBuf.length, 28); // file name length
    cdHeader.writeUInt16LE(0, 30);               // extra field length
    cdHeader.writeUInt16LE(0, 32);               // comment length
    cdHeader.writeUInt16LE(0, 34);               // disk number start
    cdHeader.writeUInt16LE(0, 36);               // internal file attributes
    cdHeader.writeUInt32LE(0, 38);               // external file attributes
    cdHeader.writeUInt32LE(entry.offset, 42);    // relative offset of local header
    entry.pathBuf.copy(cdHeader, 46);

    parts.push(cdHeader);
    currentOffset += cdHeader.length;
  }

  const centralDirSize = currentOffset - centralDirStartOffset;
  // End of central directory record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);                 // signature
  eocd.writeUInt16LE(0, 4);                          // number of this disk
  eocd.writeUInt16LE(0, 6);                          // disk where central directory starts
  eocd.writeUInt16LE(fileEntries.length, 8);         // number of central directory records on this disk
  eocd.writeUInt16LE(fileEntries.length, 10);        // total number of central directory records
  eocd.writeUInt32LE(centralDirSize, 12);            // size of central directory
  eocd.writeUInt32LE(centralDirStartOffset, 16);     // offset of start of central directory
  eocd.writeUInt16LE(0, 20);                         // zip comment length
  parts.push(eocd);

  return Buffer.concat(parts);
}

/**
 * Builds a valid Microsoft Excel OpenXML (.xlsx) buffer from table headers and rows.
 * @param {string} sheetName - Title of the worksheet
 * @param {string[]} headers - Array of header strings
 * @param {Array<Array<any>>} rows - 2D array of row cells
 * @returns {Buffer} - .xlsx file buffer
 */
function generateExcelBuffer(sheetName = 'Users', headers = [], rows = []) {
  // Construct sheet1.xml
  let sheetXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  sheetXml += '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">\n';
  sheetXml += '  <sheetData>\n';

  // Header row (Row 1) with bold styling (s="1")
  sheetXml += '    <row r="1">\n';
  headers.forEach((header, colIdx) => {
    const cellRef = getColumnName(colIdx) + '1';
    sheetXml += `      <c r="${cellRef}" t="inlineStr" s="1"><is><t>${xmlEscape(header)}</t></is></c>\n`;
  });
  sheetXml += '    </row>\n';

  // Data rows
  rows.forEach((row, rowIdx) => {
    const rowNumber = rowIdx + 2;
    sheetXml += `    <row r="${rowNumber}">\n`;
    row.forEach((cellValue, colIdx) => {
      const cellRef = getColumnName(colIdx) + rowNumber;
      sheetXml += `      <c r="${cellRef}" t="inlineStr"><is><t>${xmlEscape(cellValue)}</t></is></c>\n`;
    });
    sheetXml += '    </row>\n';
  });

  sheetXml += '  </sheetData>\n';
  sheetXml += '</worksheet>';

  // Standard OpenXML structures
  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${xmlEscape(sheetName)}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><name val="Calibri"/><sz val="11"/></font>
    <font><b/><name val="Calibri"/><sz val="11"/><color rgb="FFFFFFFF"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF0F172A"/></patternFill></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/></border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
  </cellXfs>
</styleSheet>`;

  const files = [
    { path: '[Content_Types].xml', content: contentTypesXml },
    { path: '_rels/.rels', content: rootRelsXml },
    { path: 'xl/_rels/workbook.xml.rels', content: workbookRelsXml },
    { path: 'xl/workbook.xml', content: workbookXml },
    { path: 'xl/styles.xml', content: stylesXml },
    { path: 'xl/worksheets/sheet1.xml', content: sheetXml },
  ];

  return createZipArchive(files);
}

module.exports = {
  generateExcelBuffer,
};