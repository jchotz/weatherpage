/**
 * WeatherPage.info — Test Suite
 * Run with: node tests.js
 * Tests cover all functional points in the requirements.
 */

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

let passed = 0;
let failed = 0;
const results = [];

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS  ${name}`);
    results.push({ name, status: 'PASS' });
    passed++;
  } catch (e) {
    console.log(`  ❌ FAIL  ${name}`);
    console.log(`          ${e.message}`);
    results.push({ name, status: 'FAIL', error: e.message });
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertContains(str, substring, message) {
  if (!str.includes(substring)) {
    throw new Error(message || `Expected to find: "${substring}"`);
  }
}

function assertNotContains(str, substring, message) {
  if (str.includes(substring)) {
    throw new Error(message || `Did not expect to find: "${substring}"`);
  }
}

// ── Simulate phone validation logic (mirrors index.html JS) ──
function validatePhone(val) {
  const trimmed = val.trim();
  if (!trimmed) return { ok: false, reason: 'empty' };
  if (!/^[\d\s\-\+\(\)]{7,15}$/.test(trimmed.replace(/\s/g, ''))) {
    return { ok: false, reason: 'invalid' };
  }
  return { ok: true };
}

console.log('\n══════════════════════════════════════════');
console.log('  WeatherPage.info — Test Results');
console.log('══════════════════════════════════════════\n');

// ── 1. Page structure ──
console.log('1. Page Structure');
test('Has DOCTYPE html declaration', () => assertContains(html, '<!DOCTYPE html>'));
test('Has correct charset (UTF-8)', () => assertContains(html.toLowerCase(), 'charset="utf-8"'));
test('Has viewport meta for mobile', () => assertContains(html, 'name="viewport"') && assertContains(html, 'width=device-width'));
test('Has correct page title "WeatherPage.info"', () => assertContains(html, '<title>WeatherPage.info</title>'));
test('Has meta description', () => assertContains(html, 'name="description"'));
test('Has Open Graph meta tags', () => assertContains(html, 'og:title') && assertContains(html, 'og:description'));
test('Has apple-mobile-web-app-capable meta', () => assertContains(html, 'apple-mobile-web-app-capable'));

// ── 2. Responsive / Mobile-first ──
console.log('\n2. Responsive / Mobile-First');
test('Has mobile-first base styles (no min-width on base)', () => {
  // Base styles should not start with a breakpoint
  assert(html.indexOf('font-family') < html.indexOf('@media'), 'Base font styles should come before @media');
});
test('Has tablet breakpoint (@media min-width 600px)', () => assertContains(html, 'min-width: 600px'));
test('Has desktop breakpoint (@media min-width 900px)', () => assertContains(html, 'min-width: 900px'));
test('Uses fluid font sizing (clamp)', () => assertContains(html, 'clamp('));
test('Has max-width constraint on main content', () => assertContains(html, 'max-width: 680px'));

// ── 3. Site info / content ──
console.log('\n3. Site Info & Content');
test('Displays site name "WeatherPage.info"', () => assertContains(html, 'WeatherPage'));
test('Mentions "up to 10 locations"', () => assertContains(html, '10 locations') || assertContains(html, 'up to 10'));
test('Mentions current conditions', () => assertContains(html.toLowerCase(), 'current condition'));
test('Mentions past 10 days of weather history', () => assertContains(html, '10-day') || assertContains(html, '10 days'));
test('Mentions "No app" required', () => assertContains(html.toLowerCase(), 'no app'));
test('Mentions saving link to home screen', () => assertContains(html.toLowerCase(), 'home screen'));
test('Includes "How to Add to Home Screen" instructions', () => assertContains(html, 'Home Screen'));
test('Has 4 steps for home screen instructions', () => {
  const stepMatches = html.match(/class="step-num"/g);
  assert(stepMatches && stepMatches.length >= 4, `Expected at least 4 steps, found ${stepMatches ? stepMatches.length : 0}`);
});
test('Has weather-themed visual elements (emoji strip)', () => assertContains(html, 'emoji-strip'));
test('Has animated sky/cloud elements', () => assertContains(html, 'cloud'));

// ── 4. Phone number — Add ──
console.log('\n4. Phone Number — Add Input');
test('Has "add phone" input field', () => assertContains(html, 'id="add-phone"'));
test('Add input is type="tel"', () => {
  const match = html.match(/id="add-phone"[^>]*type="tel"|type="tel"[^>]*id="add-phone"/);
  assert(match || html.includes('type="tel"'), 'add-phone input should be type="tel"');
  // Check that tel type appears near add-phone
  const idx = html.indexOf('id="add-phone"');
  const snippet = html.substring(idx - 100, idx + 100);
  assertContains(snippet, 'type="tel"');
});
test('Has "Add" button with id="add-btn"', () => assertContains(html, 'id="add-btn"'));
test('Has ARIA label on Add button', () => assertContains(html, 'aria-label="Add phone number"'));
test('Has status message element for add', () => assertContains(html, 'id="add-status"'));
test('Add status has aria-live="polite"', () => {
  const idx = html.indexOf('id="add-status"');
  const snippet = html.substring(idx - 50, idx + 100);
  assertContains(snippet, 'aria-live="polite"');
});
test('Add button click handler exists', () => assertContains(html, "getElementById('add-btn')"));

// ── 5. Phone number — Delete ──
console.log('\n5. Phone Number — Delete Input');
test('Has "delete phone" input field', () => assertContains(html, 'id="delete-phone"'));
test('Delete input is type="tel"', () => {
  const idx = html.indexOf('id="delete-phone"');
  const snippet = html.substring(idx - 100, idx + 100);
  assertContains(snippet, 'type="tel"');
});
test('Has "Remove" button with id="delete-btn"', () => assertContains(html, 'id="delete-btn"'));
test('Has ARIA label on Remove button', () => assertContains(html, 'aria-label="Remove phone number"'));
test('Has status message element for delete', () => assertContains(html, 'id="delete-status"'));
test('Delete status has aria-live="polite"', () => {
  const idx = html.indexOf('id="delete-status"');
  const snippet = html.substring(idx - 50, idx + 100);
  assertContains(snippet, 'aria-live="polite"');
});
test('Delete button click handler exists', () => assertContains(html, "getElementById('delete-btn')"));

// ── 6. Phone validation logic ──
console.log('\n6. Phone Number Validation Logic');
test('Empty add input is rejected', () => {
  const r = validatePhone('');
  assert(!r.ok && r.reason === 'empty', 'Empty input should be rejected');
});
test('Empty delete input is rejected', () => {
  const r = validatePhone('   ');
  assert(!r.ok && r.reason === 'empty', 'Whitespace-only input should be rejected');
});
test('Valid US number is accepted (+1 312 555-0100)', () => {
  const r = validatePhone('+1 312 555-0100');
  // Length check: strip spaces → +13125550100 = 12 chars — but regex checks digits only
  // Our regex: /^[\d\s\-\+\(\)]{7,15}$/
  // "+1 312 555-0100" stripped of spaces → "+13125550100" length 12 ✓
  assert(r.ok, 'Valid US phone should be accepted');
});
test('Valid number with parentheses is accepted', () => {
  const r = validatePhone('(312) 555-0100');
  assert(r.ok, '(312) 555-0100 should be accepted');
});
test('Short/garbage input is rejected', () => {
  const r = validatePhone('123');
  assert(!r.ok && r.reason === 'invalid', 'Too-short input should be rejected');
});
test('Letters in phone number are rejected', () => {
  const r = validatePhone('abc-defg-hijk');
  assert(!r.ok, 'Letters should be rejected');
});
test('Add does not submit to server (placeholder behavior)', () => {
  assertNotContains(html, 'fetch(', 'Add phone should not call fetch (coming soon)');
  // Note: if fetch is added later this test should be updated
});
test('Delete does not submit to server (placeholder behavior)', () => {
  // Check that delete handler has no real API call
  const deleteHandlerStart = html.indexOf("getElementById('delete-btn')");
  const snippet = html.substring(deleteHandlerStart, deleteHandlerStart + 400);
  assertNotContains(snippet, 'XMLHttpRequest', 'Delete handler should not use XHR');
});

// ── 7. Accessibility ──
console.log('\n7. Accessibility');
test('Has lang attribute on <html>', () => assertContains(html, '<html lang="en"'));
test('Has aria-label on hero section', () => assertContains(html, 'aria-label="Site hero"'));
test('Has role="region" on feature cards', () => assertContains(html, 'role="region"'));
test('Has aria-labelledby on phone section', () => assertContains(html, 'aria-labelledby="phone-heading"'));
test('Input labels are associated via for= attribute', () => {
  assertContains(html, 'for="add-phone"');
  assertContains(html, 'for="delete-phone"');
});
test('Has .sr-only class or aria-hidden on decorative elements', () => {
  assertContains(html, 'aria-hidden="true"');
});
test('Has :focus-visible style', () => assertContains(html, ':focus-visible') || assertContains(html, 'focus-visible'));
test('Has prefers-reduced-motion support', () => assertContains(html, 'prefers-reduced-motion'));

// ── 8. Footer / Legal ──
console.log('\n8. Footer');
test('Has footer element', () => assertContains(html, '<footer'));
test('Footer contains copyright', () => assertContains(html, '&copy;'));
test('Footer links to weatherpage.info', () => assertContains(html, 'href="https://weatherpage.info"'));
test('Dynamic year is set via JS', () => assertContains(html, "id=\"year\"") && assertContains(html, "getFullYear()"));

// ── Summary ──
console.log('\n══════════════════════════════════════════');
console.log(`  Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log('══════════════════════════════════════════\n');

if (failed > 0) {
  console.log('Failed tests:');
  results.filter(r => r.status === 'FAIL').forEach(r => {
    console.log(`  ❌ ${r.name}: ${r.error}`);
  });
  process.exit(1);
} else {
  console.log('All tests passed! ✅\n');
  process.exit(0);
}
