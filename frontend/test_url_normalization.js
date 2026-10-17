const assert = require('assert');

// Import or copy normalizeApiUrl logic for Node environment
function normalizeApiUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return 'https://scoutx-backend-ub59.onrender.com/api';
  }

  let clean = rawUrl.trim();
  if (!clean) {
    return 'https://scoutx-backend-ub59.onrender.com/api';
  }

  // Strip trailing slashes
  clean = clean.replace(/\/+$/, '');

  // Extract optional protocol
  let proto = '';
  let hostAndPath = clean;
  const protoMatch = clean.match(/^(https?:\/\/)/i);
  if (protoMatch) {
    proto = protoMatch[1].toLowerCase();
    hostAndPath = clean.slice(proto.length);
  }

  // Split host and path
  let [hostPart, ...pathParts] = hostAndPath.split('/');
  let pathPart = pathParts.join('/');

  const isLocalHost =
    hostPart.startsWith('localhost') ||
    hostPart.startsWith('127.0.0.1') ||
    /^192\.168\.\d{1,3}\.\d{1,3}/.test(hostPart) ||
    /^10\.\d{1,3}\.\d{1,3}/.test(hostPart) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}/.test(hostPart);

  // If host has no dots and no port, and is not local, it is a bare Render service name (e.g. 'scoutx-backend-ub59')
  if (!hostPart.includes('.') && !hostPart.includes(':') && !isLocalHost) {
    hostPart = `${hostPart}.onrender.com`;
  }

  // Determine protocol:
  // Local development supports http://.
  // ALL public / cloud domains must use https:// to strictly prevent mixed-content blocks!
  if (isLocalHost) {
    proto = proto || 'http://';
  } else {
    proto = 'https://';
  }

  // Reconstruct URL with /api path
  let normalized = `${proto}${hostPart}`;
  if (pathPart) {
    pathPart = pathPart.replace(/^\/+|\/+$/g, '');
    if (pathPart === 'api' || pathPart.endsWith('/api')) {
      normalized = `${normalized}/${pathPart}`;
    } else {
      normalized = `${normalized}/${pathPart}/api`;
    }
  } else {
    normalized = `${normalized}/api`;
  }

  // Final normalization: avoid duplicate slashes in path and duplicate /api/api
  normalized = normalized.replace(/([^:])\/\/+/g, '$1/');
  normalized = normalized.replace(/\/api\/api$/i, '/api');

  return normalized;
}

const testCases = [
  {
    name: '1. Full production HTTPS URL with /api',
    input: 'https://scoutx-backend-ub59.onrender.com/api',
    expected: 'https://scoutx-backend-ub59.onrender.com/api',
  },
  {
    name: '2. Full production HTTPS URL without /api',
    input: 'https://scoutx-backend-ub59.onrender.com',
    expected: 'https://scoutx-backend-ub59.onrender.com/api',
  },
  {
    name: '3. Bare Render service name (from Render property: host)',
    input: 'scoutx-backend-ub59',
    expected: 'https://scoutx-backend-ub59.onrender.com/api',
  },
  {
    name: '4. Another bare Render service name',
    input: 'scoutx-backend',
    expected: 'https://scoutx-backend.onrender.com/api',
  },
  {
    name: '5. Insecure HTTP bare service name (must upgrade to HTTPS & append .onrender.com)',
    input: 'http://scoutx-backend-ub59',
    expected: 'https://scoutx-backend-ub59.onrender.com/api',
  },
  {
    name: '6. Insecure HTTP bare service name with /api',
    input: 'http://scoutx-backend-ub59/api',
    expected: 'https://scoutx-backend-ub59.onrender.com/api',
  },
  {
    name: '7. Local development localhost with port and /api',
    input: 'http://localhost:5000/api',
    expected: 'http://localhost:5000/api',
  },
  {
    name: '8. Local development localhost without protocol or /api',
    input: 'localhost:5000',
    expected: 'http://localhost:5000/api',
  },
  {
    name: '9. Local 127.0.0.1 IP',
    input: 'http://127.0.0.1:5000',
    expected: 'http://127.0.0.1:5000/api',
  },
  {
    name: '10. Local LAN IP',
    input: '192.168.1.79:5000',
    expected: 'http://192.168.1.79:5000/api',
  },
  {
    name: '11. Empty string fallback',
    input: '',
    expected: 'https://scoutx-backend-ub59.onrender.com/api',
  },
  {
    name: '12. Null / Undefined fallback',
    input: null,
    expected: 'https://scoutx-backend-ub59.onrender.com/api',
  },
  {
    name: '13. URL with trailing slashes',
    input: 'https://scoutx-backend-ub59.onrender.com/api///',
    expected: 'https://scoutx-backend-ub59.onrender.com/api',
  },
];

console.log('🧪 Running normalizeApiUrl test suite...\n');
let passed = 0;
let failed = 0;

for (const tc of testCases) {
  const result = normalizeApiUrl(tc.input);
  try {
    assert.strictEqual(result, tc.expected);
    console.log(`✅ PASS: ${tc.name}`);
    console.log(`   Input:    ${tc.input}`);
    console.log(`   Output:   ${result}\n`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: ${tc.name}`);
    console.error(`   Input:    ${tc.input}`);
    console.error(`   Expected: ${tc.expected}`);
    console.error(`   Actual:   ${result}\n`);
    failed++;
  }
}

console.log(`========================================`);
console.log(`Summary: ${passed} passed, ${failed} failed`);
console.log(`========================================`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 All URL normalization test cases passed successfully!');
}
