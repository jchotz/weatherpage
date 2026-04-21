/**
 * WeatherPage.info — Full Test Suite v2
 * Covers: index.html structure, Get Started Now section, validation logic,
 *         submit.php logic (simulated), template.html structure, phone manage section
 * Run with: node tests2.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const INDEX    = fs.readFileSync(path.join(__dirname, 'index.html'),   'utf8');
const SUBMIT   = fs.readFileSync(path.join(__dirname, 'submit.php'),   'utf8');
const TEMPLATE = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');

let passed = 0, failed = 0;
const failures = [];

function test(group, name, fn) {
  try {
    fn();
    console.log(`  ✅  ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ❌  ${name}`);
    console.log(`       → ${e.message}`);
    failed++;
    failures.push({ group, name, error: e.message });
  }
}

function assert(cond, msg)         { if (!cond) throw new Error(msg || 'Assertion failed'); }
function has(src, str, msg)        { if (!src.includes(str)) throw new Error(msg || `Missing: "${str}"`); }
function hasRx(src, rx, msg)       { if (!rx.test(src)) throw new Error(msg || `No match for: ${rx}`); }
function hasNot(src, str, msg)     { if (src.includes(str)) throw new Error(msg || `Should not contain: "${str}"`); }

// ── Mirror JS validation from index.html ──────────────────────
function validateCity(val) {
  return /^[a-zA-Z\s\.\-]+,\s*[a-zA-Z\s]{2,}$/.test((val || '').trim());
}
function validateUSPhone(val) {
  const digits = (val || '').replace(/\D/g, '');
  if (digits.length === 10) return true;
  if (digits.length === 11 && digits[0] === '1') return true;
  return false;
}

// ── Mirror PHP phone sanitization ────────────────────────────
function phpPhoneDigits(val) {
  return (val || '').replace(/\D/g, '');
}
function phpPhoneValid(val) {
  const d = phpPhoneDigits(val);
  return d.length >= 10 && d.length <= 11;
}

// ── Mirror PHP regex replacements ─────────────────────────────
function phpBuildPage(template, lat, lon, tz, location, sub) {
  let t = template;
  t = t.replace(/const LAT\s*=\s*[^;]+;/,             `const LAT           = ${lat};`);
  t = t.replace(/const LON\s*=\s*[^;]+;/,             `const LON           = ${lon};`);
  t = t.replace(/const TZ\s*=\s*"[^"]*";/,            `const TZ            = "${tz}";`);
  t = t.replace(/const LOCATION_NAME\s*=\s*"[^"]*";/, `const LOCATION_NAME = "${location}";`);
  t = t.replace(/const LOCATION_SUB\s*=\s*"[^"]*";/,  `const LOCATION_SUB  = "${sub}";`);
  t = t.replace('<title id="page-title">Weather</title>', `<title>${location} Weather</title>`);
  return t;
}

// ─────────────────────────────────────────────────────────────
// 1. index.html — Page Structure
// ─────────────────────────────────────────────────────────────
console.log('\n══════════════════════════════════════════════════════');
console.log('  WeatherPage.info — Test Suite v2');
console.log('══════════════════════════════════════════════════════\n');

console.log('1. index.html — Page Structure');
test('Structure', 'Has DOCTYPE html',                    () => has(INDEX, '<!DOCTYPE html>'));
test('Structure', 'charset UTF-8',                       () => has(INDEX.toLowerCase(), 'charset="utf-8"'));
test('Structure', 'Viewport meta for mobile',            () => has(INDEX, 'width=device-width'));
test('Structure', 'Page title is WeatherPage.info',      () => has(INDEX, '<title>WeatherPage.info</title>'));
test('Structure', 'apple-mobile-web-app-capable',        () => has(INDEX, 'apple-mobile-web-app-capable'));
test('Structure', 'og:title meta',                       () => has(INDEX, 'og:title'));
test('Structure', 'lang=en on html element',             () => has(INDEX, '<html lang="en"'));
test('Structure', 'Inter font loaded',                   () => has(INDEX, 'Inter'));
test('Structure', ':focus-visible style present',        () => has(INDEX, ':focus-visible'));
test('Structure', 'prefers-reduced-motion media query',  () => has(INDEX, 'prefers-reduced-motion'));

// ─────────────────────────────────────────────────────────────
// 2. index.html — Responsive / Mobile-First
// ─────────────────────────────────────────────────────────────
console.log('\n2. index.html — Responsive / Mobile-First');
test('Responsive', 'Base styles before @media',          () => assert(INDEX.indexOf('font-family') < INDEX.indexOf('@media')));
test('Responsive', 'Tablet breakpoint 600px',            () => has(INDEX, 'min-width: 600px'));
test('Responsive', 'Desktop breakpoint 900px',           () => has(INDEX, 'min-width: 900px'));
test('Responsive', 'Uses clamp() for fluid type',        () => has(INDEX, 'clamp('));
test('Responsive', 'max-width on main content',          () => has(INDEX, 'max-width: 680px'));

// ─────────────────────────────────────────────────────────────
// 3. index.html — Hero & Branding
// ─────────────────────────────────────────────────────────────
console.log('\n3. index.html — Hero & Branding');
test('Hero', 'WeatherPage branding present',             () => has(INDEX, 'WeatherPage'));
test('Hero', 'Animated cloud elements',                  () => has(INDEX, 'class="cloud'));
test('Hero', 'Sun graphic element',                      () => has(INDEX, 'class="sun"'));
test('Hero', 'Emoji weather strip',                      () => has(INDEX, 'emoji-strip'));
test('Hero', 'Tagline present',                          () => has(INDEX, 'no app required'));

// ─────────────────────────────────────────────────────────────
// 4. index.html — About Section
// ─────────────────────────────────────────────────────────────
console.log('\n4. index.html — About Section');
test('About', 'Mentions up to 10 locations',             () => has(INDEX, '10 locations'));
test('About', 'Mentions current conditions',             () => has(INDEX.toLowerCase(), 'current condition'));
test('About', 'Mentions 10-day history',                 () => has(INDEX, '10-day'));
test('About', 'Mentions no app',                         () => has(INDEX.toLowerCase(), 'no app'));
test('About', 'Mentions home screen',                    () => has(INDEX.toLowerCase(), 'home screen'));

// ─────────────────────────────────────────────────────────────
// 5. index.html — "How to Add to Home Screen" REMOVED
// ─────────────────────────────────────────────────────────────
console.log('\n5. index.html — "How to Add" Section Removed');
test('Removed', '"How to Add to Your Home Screen" heading gone', () =>
  hasNot(INDEX, 'How to Add to Your Home Screen'));
test('Removed', 'step-num class removed',                () => hasNot(INDEX, 'class="step-num"'));
test('Removed', 'Safari instructions removed',           () => hasNot(INDEX, 'Open Safari'));

// ─────────────────────────────────────────────────────────────
// 6. index.html — Get Started Now Section
// ─────────────────────────────────────────────────────────────
console.log('\n6. index.html — Get Started Now Section');
test('GetStarted', '"Get Started Now" heading present',  () => has(INDEX, 'Get Started Now'));
test('GetStarted', 'City/State input #gs-city exists',   () => has(INDEX, 'id="gs-city"'));
test('GetStarted', 'gs-city is type text',               () => {
  const idx = INDEX.indexOf('id="gs-city"');
  const snip = INDEX.substring(idx - 120, idx + 120);
  has(snip, 'type="text"');
});
test('GetStarted', 'City placeholder shows format hint', () => has(INDEX, 'e.g. Chicago, IL'));
test('GetStarted', 'Phone input #gs-phone exists',       () => has(INDEX, 'id="gs-phone"'));
test('GetStarted', 'gs-phone is type="tel"',             () => {
  const idx = INDEX.indexOf('id="gs-phone"');
  const snip = INDEX.substring(idx - 120, idx + 120);
  has(snip, 'type="tel"');
});
test('GetStarted', 'Phone placeholder shows format hint',() => has(INDEX, 'e.g. (312) 555-0100'));
test('GetStarted', 'Send It button present',             () => has(INDEX, 'Send It'));
test('GetStarted', 'Send It button has id="send-btn"',   () => has(INDEX, 'id="send-btn"'));
test('GetStarted', 'City error div #gs-city-error',      () => has(INDEX, 'id="gs-city-error"'));
test('GetStarted', 'Phone error div #gs-phone-error',    () => has(INDEX, 'id="gs-phone-error"'));
test('GetStarted', 'Submit status div present',          () => has(INDEX, 'id="submit-status"'));
test('GetStarted', 'Result link div present',            () => has(INDEX, 'id="result-link"'));
test('GetStarted', 'Result URL anchor present',          () => has(INDEX, 'id="result-url"'));
test('GetStarted', 'aria-live on error divs',            () => has(INDEX, 'aria-live="polite"'));
test('GetStarted', 'fetch() posts to submit.php',        () => has(INDEX, "fetch('submit.php'"));

// ─────────────────────────────────────────────────────────────
// 7. JS Validation — City/State
// ─────────────────────────────────────────────────────────────
console.log('\n7. JS Validation — City/State');
test('CityVal', 'Chicago, IL accepted',                  () => assert(validateCity('Chicago, IL')));
test('CityVal', 'New York, NY accepted',                 () => assert(validateCity('New York, NY')));
test('CityVal', 'St. Louis, MO accepted',                () => assert(validateCity('St. Louis, MO')));
test('CityVal', 'Valentine, NE accepted',                () => assert(validateCity('Valentine, NE')));
test('CityVal', 'Empty string rejected',                 () => assert(!validateCity('')));
test('CityVal', 'City only (no comma) rejected',         () => assert(!validateCity('Chicago')));
test('CityVal', 'Just a comma rejected',                 () => assert(!validateCity(',')));
test('CityVal', 'Numbers in city rejected',              () => assert(!validateCity('12345, IL')));
test('CityVal', 'Whitespace-only rejected',              () => assert(!validateCity('   ')));

// ─────────────────────────────────────────────────────────────
// 8. JS Validation — USA Phone Number
// ─────────────────────────────────────────────────────────────
console.log('\n8. JS Validation — USA Phone Number');
test('PhoneVal', '10-digit plain accepted',              () => assert(validateUSPhone('3125550100')));
test('PhoneVal', 'Formatted (312) 555-0100 accepted',    () => assert(validateUSPhone('(312) 555-0100')));
test('PhoneVal', '11-digit with leading 1 accepted',     () => assert(validateUSPhone('13125550100')));
test('PhoneVal', '+1 (312) 555-0100 accepted',           () => assert(validateUSPhone('+1 (312) 555-0100')));
test('PhoneVal', '312-555-0100 accepted',                () => assert(validateUSPhone('312-555-0100')));
test('PhoneVal', 'Empty string rejected',                () => assert(!validateUSPhone('')));
test('PhoneVal', '9 digits rejected',                    () => assert(!validateUSPhone('312555010')));
test('PhoneVal', '11 digits not starting with 1 rejected', () => assert(!validateUSPhone('23125550100')));
test('PhoneVal', 'Letters rejected',                     () => assert(!validateUSPhone('abcdefghij')));
test('PhoneVal', 'Too-short number rejected',            () => assert(!validateUSPhone('123')));

// ─────────────────────────────────────────────────────────────
// 9. submit.php — Structure & Logic
// ─────────────────────────────────────────────────────────────
console.log('\n9. submit.php — Structure & Logic');
test('PHP', 'Returns JSON header',                       () => has(SUBMIT, "application/json"));
test('PHP', 'Reads city_state from POST',                () => has(SUBMIT, "$_POST['city_state']"));
test('PHP', 'Reads phone from POST',                     () => has(SUBMIT, "$_POST['phone']"));
test('PHP', 'Strips non-digits from phone',              () => has(SUBMIT, "preg_replace('/\\D/', '', \$phone)"));
test('PHP', 'Validates phone length 10-11 digits',       () => has(SUBMIT, 'strlen($phone_digits) < 10'));
test('PHP', 'Calls Open-Meteo geocoding API',            () => has(SUBMIT, 'geocoding-api.open-meteo.com'));
test('PHP', 'Handles empty geocode results',             () => has(SUBMIT, "empty(\$geo['results'][0])"));
test('PHP', 'Creates /dat directory if missing',         () => has(SUBMIT, "mkdir(\$dat_dir"));
test('PHP', 'Writes .dat file to /dat folder',           () => has(SUBMIT, "'/dat'") && has(SUBMIT, 'file_put_contents($dat_file'));
test('PHP', 'Reads template.html',                       () => has(SUBMIT, "file_get_contents(__DIR__ . '/template.html')"));
test('PHP', 'Replaces LAT in template',                  () => has(SUBMIT, 'const LAT'));
test('PHP', 'Replaces LON in template',                  () => has(SUBMIT, 'const LON'));
test('PHP', 'Replaces TZ in template',                   () => has(SUBMIT, 'const TZ'));
test('PHP', 'Replaces LOCATION_NAME in template',        () => has(SUBMIT, 'const LOCATION_NAME'));
test('PHP', 'Replaces LOCATION_SUB in template',         () => has(SUBMIT, 'const LOCATION_SUB'));
test('PHP', 'Updates <title> in generated page',         () => has(SUBMIT, '<title id="page-title">Weather</title>'));
test('PHP', 'Writes .html file to root',                 () => has(SUBMIT, 'file_put_contents($html_file'));
test('PHP', 'Returns ok:true on success',                () => has(SUBMIT, "'ok'       => true"));
test('PHP', 'Returns URL in response',                   () => has(SUBMIT, "'url'"));
test('PHP', 'Returns ok:false on error',                 () => has(SUBMIT, "'ok' => false"));
test('PHP', 'URL includes weatherpage.info domain',      () => has(SUBMIT, 'weatherpage.info'));

// ─────────────────────────────────────────────────────────────
// 10. submit.php — Phone validation (PHP logic mirrored)
// ─────────────────────────────────────────────────────────────
console.log('\n10. submit.php — PHP Phone Validation (mirrored)');
test('PHPPhone', '10-digit number valid',                () => assert(phpPhoneValid('3125550100')));
test('PHPPhone', '11-digit number valid',                () => assert(phpPhoneValid('13125550100')));
test('PHPPhone', 'Formatted number valid',               () => assert(phpPhoneValid('(312) 555-0100')));
test('PHPPhone', '9-digit number invalid',               () => assert(!phpPhoneValid('312555010')));
test('PHPPhone', '12-digit number invalid',              () => assert(!phpPhoneValid('123456789012')));
test('PHPPhone', 'Empty string invalid',                 () => assert(!phpPhoneValid('')));

// ─────────────────────────────────────────────────────────────
// 11. submit.php — Template replacement logic (mirrored)
// ─────────────────────────────────────────────────────────────
console.log('\n11. submit.php — Template Replacement Logic');
const generated = phpBuildPage(TEMPLATE, 41.85, -87.65, 'America/Chicago', 'Chicago, Illinois', 'Illinois · Elev. 594 ft');

test('Replacement', 'LAT replaced correctly',            () => has(generated, 'const LAT           = 41.85;'));
test('Replacement', 'LON replaced correctly',            () => has(generated, 'const LON           = -87.65;'));
test('Replacement', 'TZ replaced correctly',             () => has(generated, 'const TZ            = "America/Chicago";'));
test('Replacement', 'LOCATION_NAME replaced correctly',  () => has(generated, 'const LOCATION_NAME = "Chicago, Illinois";'));
test('Replacement', 'LOCATION_SUB replaced correctly',   () => has(generated, 'const LOCATION_SUB  = "Illinois · Elev. 594 ft";'));
test('Replacement', 'Page title updated',                () => has(generated, '<title>Chicago, Illinois Weather</title>'));
test('Replacement', 'Original LAT value gone',           () => hasNot(generated, 'const LAT           = 42.8733;'));
test('Replacement', 'Original LOCATION_NAME gone',       () => hasNot(generated, '"Valentine, NE"'));
test('Replacement', 'Template HTML structure preserved', () => has(generated, '<!DOCTYPE html>'));
test('Replacement', 'Weather data JS preserved',         () => has(generated, 'loadWeather()'));
test('Replacement', 'Open-Meteo API call preserved',     () => has(generated, 'open-meteo.com'));

// ─────────────────────────────────────────────────────────────
// 12. template.html — Structure
// ─────────────────────────────────────────────────────────────
console.log('\n12. template.html — Structure');
test('Template', 'Has DOCTYPE html',                     () => has(TEMPLATE, '<!DOCTYPE html>'));
test('Template', 'Has LAT config variable',              () => has(TEMPLATE, 'const LAT'));
test('Template', 'Has LON config variable',              () => has(TEMPLATE, 'const LON'));
test('Template', 'Has TZ config variable',               () => has(TEMPLATE, 'const TZ'));
test('Template', 'Has LOCATION_NAME config variable',    () => has(TEMPLATE, 'const LOCATION_NAME'));
test('Template', 'Has LOCATION_SUB config variable',     () => has(TEMPLATE, 'const LOCATION_SUB'));
test('Template', 'Uses Open-Meteo forecast API',         () => has(TEMPLATE, 'api.open-meteo.com/v1/forecast'));
test('Template', 'Fetches 10-day forecast',              () => has(TEMPLATE, 'forecast_days=10'));
test('Template', 'Fetches 10-day history',               () => has(TEMPLATE, 'past_days=10'));
test('Template', 'Shows current conditions card',        () => has(TEMPLATE, 'id="current-card"'));
test('Template', 'Has forecast list element',            () => has(TEMPLATE, 'id="forecast-list"'));
test('Template', 'Has history list element',             () => has(TEMPLATE, 'id="history-list"'));
test('Template', 'Has loading spinner',                  () => has(TEMPLATE, 'id="loading"'));
test('Template', 'Has error message element',            () => has(TEMPLATE, 'id="error-msg"'));
test('Template', 'Temperature in Fahrenheit',            () => has(TEMPLATE, 'fahrenheit'));
test('Template', 'Wind speed in mph',                    () => has(TEMPLATE, 'mph'));
test('Template', 'WMO weather code map present',         () => has(TEMPLATE, 'const WMO'));
test('Template', 'Credits Open-Meteo in footer',         () => has(TEMPLATE, 'open-meteo.com'));

// ─────────────────────────────────────────────────────────────
// 13. index.html — Manage Phone Section
// ─────────────────────────────────────────────────────────────
console.log('\n13. index.html — Manage Phone Section');
test('PhoneMgr', 'Add phone input #add-phone exists',    () => has(INDEX, 'id="add-phone"'));
test('PhoneMgr', 'Add button #add-btn exists',           () => has(INDEX, 'id="add-btn"'));
test('PhoneMgr', 'Add status div #add-status exists',    () => has(INDEX, 'id="add-status"'));
test('PhoneMgr', 'Delete phone input #delete-phone',     () => has(INDEX, 'id="delete-phone"'));
test('PhoneMgr', 'Delete button #delete-btn exists',     () => has(INDEX, 'id="delete-btn"'));
test('PhoneMgr', 'Delete status div #delete-status',     () => has(INDEX, 'id="delete-status"'));
test('PhoneMgr', 'Add handler does not call fetch',      () => {
  const addStart = INDEX.indexOf("getElementById('add-btn')");
  const addEnd   = INDEX.indexOf("getElementById('delete-btn')");
  const snippet  = INDEX.substring(addStart, addEnd);
  hasNot(snippet, 'fetch(');
});
test('PhoneMgr', 'Delete handler does not call fetch',   () => {
  const delStart = INDEX.indexOf("getElementById('delete-btn')");
  const delEnd   = INDEX.indexOf('</script>');
  const snippet  = INDEX.substring(delStart, delEnd);
  hasNot(snippet, 'fetch(');
});

// ─────────────────────────────────────────────────────────────
// 14. index.html — Footer
// ─────────────────────────────────────────────────────────────
console.log('\n14. index.html — Footer');
test('Footer', 'Footer element present',                 () => has(INDEX, '<footer'));
test('Footer', 'Copyright symbol present',               () => has(INDEX, '&copy;'));
test('Footer', 'Links to weatherpage.info',              () => has(INDEX, 'href="https://weatherpage.info"'));
test('Footer', 'Dynamic year via JS',                    () => has(INDEX, 'getFullYear()'));

// ─────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────
const total = passed + failed;
console.log('\n══════════════════════════════════════════════════════');
console.log(`  Total: ${total}  |  ✅ Passed: ${passed}  |  ❌ Failed: ${failed}`);
console.log('══════════════════════════════════════════════════════\n');

if (failures.length) {
  console.log('Failed tests:');
  failures.forEach(f => console.log(`  ❌ [${f.group}] ${f.name}\n     → ${f.error}`));
  console.log('');
  process.exit(1);
} else {
  console.log('All tests passed! ✅\n');
  process.exit(0);
}
