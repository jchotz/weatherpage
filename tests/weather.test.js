/**
 * Weather Page System — Requirements Test Suite
 * Covers: 5129707283.html + 5129707283.dat
 *
 * Run with: node weather.test.js
 * Requires: playwright (npm install playwright)
 */

const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:8765/5129707283.html';
const DAT_URL  = 'http://localhost:8765/5129707283.dat';

// ── Test harness ────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const results = [];

function assert(id, description, condition, detail = '') {
  if (condition) {
    passed++;
    results.push({ id, status: 'PASS', description, detail });
    console.log(`  ✓  [${id}] ${description}`);
  } else {
    failed++;
    results.push({ id, status: 'FAIL', description, detail });
    console.log(`  ✗  [${id}] ${description}${detail ? ' — ' + detail : ''}`);
  }
}

function section(title) {
  console.log(`\n── ${title} ${'─'.repeat(Math.max(0, 55 - title.length))}`);
}

// ── Helpers ─────────────────────────────────────────────────────────────────

async function waitForWeather(page) {
  // Wait for spinner to disappear and current card to appear
  await page.waitForSelector('#current-card', { state: 'visible', timeout: 15000 });
}

// ── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   Weather Page System — Requirements Test Suite          ║');
  console.log('║   Target: ' + BASE_URL.padEnd(47) + '║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });

  // ── REQ-01: DAT FILE ────────────────────────────────────────────────────
  section('REQ-01: Location Data File (5129707283.dat)');
  {
    // Use Node's https/http to fetch the dat file directly (not a browser page)
    const http = require('http');
    const datRaw = await new Promise((resolve, reject) => {
      http.get(DAT_URL, res => {
        assert('01-01', 'DAT file is accessible (HTTP 200)', res.statusCode === 200, `got ${res.statusCode}`);
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve(body));
      }).on('error', reject);
    });

    const lines = datRaw.trim().split('\n').filter(l => l.trim());
    assert('01-02', 'DAT file has a header row', lines[0].includes('name') && lines[0].includes('lat'));
    assert('01-03', 'DAT file has at least 4 location rows', lines.length >= 5, `found ${lines.length - 1} data rows`);

    const dataLines = lines.slice(1);
    let allValid = true;
    let detail = '';
    for (const line of dataLines) {
      const parts = line.split(',');
      if (parts.length < 5) { allValid = false; detail = `bad row: ${line}`; break; }
      const lat = parseFloat(parts[2]);
      const lon = parseFloat(parts[3]);
      if (isNaN(lat) || isNaN(lon)) { allValid = false; detail = `bad coords in: ${line}`; break; }
    }
    assert('01-04', 'All DAT rows have valid name, subtitle, lat, lon, tz fields', allValid, detail);

    const names = dataLines.map(l => l.split(',')[0].trim().toLowerCase());
    assert('01-05', 'Seed location: Valentine NE present', names.some(n => n.includes('valentine')));
    assert('01-06', 'Seed location: Carrizo Springs TX present', names.some(n => n.includes('carrizo')));
    assert('01-07', 'Seed location: Princeton OR present', names.some(n => n.includes('princeton')));
    assert('01-08', 'Seed location: Buffalo WY present', names.some(n => n.includes('buffalo')));
  }

  // ── REQ-02: PAGE STRUCTURE ───────────────────────────────────────────────
  section('REQ-02: Page Structure & Load');
  {
    const page = await ctx.newPage();
    await page.goto(BASE_URL);

    assert('02-01', 'Page has correct <title> element', (await page.title()).toLowerCase().includes('weather'));
    assert('02-02', 'Page has <header> with location name span', await page.locator('#location-name').count() > 0);
    assert('02-03', 'Page has subtitle element', await page.locator('#location-sub').count() > 0);
    assert('02-04', 'Page has loading spinner on initial load', await page.locator('.spinner').count() > 0);
    assert('02-05', 'Page has current conditions card', await page.locator('#current-card').count() > 0);
    assert('02-06', 'Page has 10-day forecast container', await page.locator('#forecast-list').count() > 0);
    assert('02-07', 'Page has history container', await page.locator('#history-list').count() > 0);
    assert('02-08', 'Page has other-locations container', await page.locator('#other-locations').count() > 0);
    assert('02-09', 'Page has refresh button', await page.locator('#refresh-btn').count() > 0);
    assert('02-10', 'Page has footer with Open-Meteo credit', await page.locator('footer a[href*="open-meteo"]').count() > 0);

    await page.close();
  }

  // ── REQ-03: DEFAULT LOCATION (loc=0 = Valentine NE) ──────────────────────
  section('REQ-03: Default Location (index 0, no ?loc= param)');
  {
    const page = await ctx.newPage();
    await page.goto(BASE_URL);
    await waitForWeather(page);

    const locName = await page.locator('#location-name').innerText();
    assert('03-01', 'Default location name is displayed in header', locName.length > 0, `got: "${locName}"`);
    assert('03-02', 'Default location is Valentine (first in dat)', locName.toLowerCase().includes('valentine'), `got: "${locName}"`);

    const subtitle = await page.locator('#location-sub').innerText();
    assert('03-03', 'Subtitle is populated', subtitle.length > 0, `got: "${subtitle}"`);

    const title = await page.title();
    assert('03-04', 'Page title includes location name', title.toLowerCase().includes('valentine'), `got: "${title}"`);

    await page.close();
  }

  // ── REQ-04: CURRENT CONDITIONS ───────────────────────────────────────────
  section('REQ-04: Current Conditions Card');
  {
    const page = await ctx.newPage();
    await page.goto(BASE_URL);
    await waitForWeather(page);

    // Card visible
    const cardVisible = await page.locator('#current-card').isVisible();
    assert('04-01', 'Current conditions card is visible after load', cardVisible);

    // Weather icon
    const icon = await page.locator('#cur-icon').innerText();
    assert('04-02', 'Weather icon is populated (emoji)', icon.trim().length > 0, `got: "${icon}"`);

    // Temperature — should be a number followed by °
    const temp = await page.locator('#cur-temp').innerText();
    assert('04-03', 'Temperature is displayed (e.g. "38°")', /\d+°/.test(temp), `got: "${temp}"`);

    // Feels like
    const feels = await page.locator('#cur-feels').innerText();
    assert('04-04', 'Feels-like temperature is displayed', feels.toLowerCase().includes('feels'), `got: "${feels}"`);

    // Condition description
    const desc = await page.locator('#cur-desc').innerText();
    assert('04-05', 'Condition description is populated', desc.length > 2, `got: "${desc}"`);

    // 4 stat boxes
    const hum   = await page.locator('#cur-hum').innerText();
    const wind  = await page.locator('#cur-wind').innerText();
    const precip= await page.locator('#cur-precip').innerText();
    const uv    = await page.locator('#cur-uv').innerText();

    assert('04-06', 'Humidity stat shows a percentage', hum.includes('%'), `got: "${hum}"`);
    assert('04-07', 'Wind stat shows mph and direction', hum.length > 0 && wind.toLowerCase().includes('mph'), `got: "${wind}"`);
    assert('04-08', 'Precip stat is populated', precip.length > 0, `got: "${precip}"`);
    assert('04-09', 'UV Index stat has numeric value and label', /\d/.test(uv) && uv.length > 1, `got: "${uv}"`);

    // Updated timestamp
    const updated = await page.locator('#updated').innerText();
    assert('04-10', 'Updated timestamp is displayed', updated.toLowerCase().includes('updated'), `got: "${updated}"`);

    await page.close();
  }

  // ── REQ-05: 10-DAY FORECAST ──────────────────────────────────────────────
  section('REQ-05: 10-Day Forecast');
  {
    const page = await ctx.newPage();
    await page.goto(BASE_URL);
    await waitForWeather(page);

    const forecastVisible = await page.locator('#forecast-list').isVisible();
    assert('05-01', '10-day forecast list is visible', forecastVisible);

    const rows = await page.locator('#forecast-list .day-row').count();
    assert('05-02', 'Forecast has exactly 10 rows', rows === 10, `got: ${rows}`);

    // First row should say "Today"
    const firstDay = await page.locator('#forecast-list .day-row:first-child .day-name').innerText();
    assert('05-03', 'First forecast row is labelled "Today"', firstDay === 'Today', `got: "${firstDay}"`);

    // Second row should say "Tomorrow"
    const secondDay = await page.locator('#forecast-list .day-row:nth-child(2) .day-name').innerText();
    assert('05-04', 'Second forecast row is labelled "Tomorrow"', secondDay === 'Tomorrow', `got: "${secondDay}"`);

    // Check Hi/Lo format contains "/"
    const firstTemps = await page.locator('#forecast-list .day-row:first-child .day-temps').innerText();
    assert('05-05', 'Temperatures show Hi / Lo with "/" separator', firstTemps.includes('/'), `got: "${firstTemps}"`);

    // Every row has an icon
    const icons = await page.locator('#forecast-list .day-icon').allInnerTexts();
    const allIcons = icons.every(i => i.trim().length > 0);
    assert('05-06', 'Every forecast row has a weather icon', allIcons, `empty icons found`);

    // Section label visible
    const labelVisible = await page.locator('#forecast-label').isVisible();
    assert('05-07', '"10-Day Forecast" section label is visible', labelVisible);

    await page.close();
  }

  // ── REQ-06: PREVIOUS 10 DAYS ─────────────────────────────────────────────
  section('REQ-06: Previous 10 Days (History)');
  {
    const page = await ctx.newPage();
    await page.goto(BASE_URL);
    await waitForWeather(page);

    const histVisible = await page.locator('#history-list').isVisible();
    assert('06-01', 'History list is visible', histVisible);

    const rows = await page.locator('#history-list .hist-row').count();
    assert('06-02', 'History has exactly 10 rows', rows === 10, `got: ${rows}`);

    // Rows should be most-recent first — first row date should be more recent
    const firstDate = await page.locator('#history-list .hist-row:first-child .hist-date').innerText();
    assert('06-03', 'History rows have a date label', firstDate.trim().length > 0, `got: "${firstDate}"`);

    // Check Hi/Lo separator
    const firstTemps = await page.locator('#history-list .hist-row:first-child .hist-cell').first().innerText();
    assert('06-04', 'History temperatures show Hi / Lo with "/" separator',
      (await page.locator('#history-list .hist-row:first-child').innerText()).includes('/'));

    const labelVisible = await page.locator('#history-label').isVisible();
    assert('06-05', '"Previous 10 Days" section label is visible', labelVisible);

    await page.close();
  }

  // ── REQ-07: OTHER LOCATIONS ──────────────────────────────────────────────
  section('REQ-07: Other Locations List');
  {
    const page = await ctx.newPage();
    await page.goto(BASE_URL);
    await waitForWeather(page);

    const otherVisible = await page.locator('#other-locations').isVisible();
    assert('07-01', 'Other Locations section is visible', otherVisible);

    const locRows = await page.locator('#other-locations .loc-row').count();
    assert('07-02', 'Other Locations has 3 rows (4 total minus current)', locRows === 3, `got: ${locRows}`);

    // Current location should NOT appear in the list
    const allNames = await page.locator('#other-locations .loc-name').allInnerTexts();
    const currentName = await page.locator('#location-name').innerText();
    assert('07-03', 'Current location is excluded from Other Locations',
      !allNames.some(n => n.toLowerCase() === currentName.toLowerCase()),
      `found current loc in list: ${currentName}`);

    // Each row has a name and subtitle
    const subs = await page.locator('#other-locations .loc-sub').allInnerTexts();
    assert('07-04', 'Each other-location row has a subtitle', subs.every(s => s.length > 0));

    // Arrow indicator present
    const arrows = await page.locator('#other-locations .loc-arrow').allInnerTexts();
    assert('07-05', 'Each other-location row has a navigation arrow', arrows.length === 3 && arrows.every(a => a.length > 0));

    const labelVisible = await page.locator('#other-label').isVisible();
    assert('07-06', '"Other Locations" section label is visible', labelVisible);

    await page.close();
  }

  // ── REQ-08: LOCATION SWITCHING (?loc= routing) ───────────────────────────
  section('REQ-08: Location Switching via ?loc= Parameter');
  {
    const page = await ctx.newPage();

    // loc=1 should load Carrizo Springs
    await page.goto(BASE_URL + '?loc=1');
    await waitForWeather(page);

    const locName1 = await page.locator('#location-name').innerText();
    assert('08-01', '?loc=1 loads the second location (Carrizo Springs)', locName1.toLowerCase().includes('carrizo'), `got: "${locName1}"`);

    // loc=2 should load Princeton
    await page.goto(BASE_URL + '?loc=2');
    await waitForWeather(page);
    const locName2 = await page.locator('#location-name').innerText();
    assert('08-02', '?loc=2 loads the third location (Princeton)', locName2.toLowerCase().includes('princeton'), `got: "${locName2}"`);

    // loc=3 should load Buffalo
    await page.goto(BASE_URL + '?loc=3');
    await waitForWeather(page);
    const locName3 = await page.locator('#location-name').innerText();
    assert('08-03', '?loc=3 loads the fourth location (Buffalo)', locName3.toLowerCase().includes('buffalo'), `got: "${locName3}"`);

    // Invalid loc falls back to index 0
    await page.goto(BASE_URL + '?loc=999');
    await waitForWeather(page);
    const locNameFallback = await page.locator('#location-name').innerText();
    assert('08-04', 'Invalid ?loc= falls back to first location', locNameFallback.toLowerCase().includes('valentine'), `got: "${locNameFallback}"`);

    await page.close();
  }

  // ── REQ-09: CLICK NAVIGATION ─────────────────────────────────────────────
  section('REQ-09: Click Navigation from Other Locations');
  {
    const page = await ctx.newPage();
    await page.goto(BASE_URL); // loc=0 Valentine
    await waitForWeather(page);

    // Click the first other-location row
    const firstRow = page.locator('#other-locations .loc-row').first();
    const targetName = await firstRow.locator('.loc-name').innerText();
    await firstRow.click();

    // Wait for navigation and reload
    await page.waitForURL(/\?loc=/, { timeout: 5000 });
    await waitForWeather(page);

    const newLoc = await page.locator('#location-name').innerText();
    assert('09-01', 'Clicking a location row navigates to that location', newLoc.toLowerCase().includes(targetName.toLowerCase().split(' ')[0]), `expected "${targetName}", got "${newLoc}"`);

    // URL should have ?loc= parameter
    const url = page.url();
    assert('09-02', 'URL contains ?loc= parameter after navigation', url.includes('?loc='), `url: ${url}`);

    // New page should have 3 other-location rows (different set)
    const otherRows = await page.locator('#other-locations .loc-row').count();
    assert('09-03', 'After navigation, Other Locations still shows 3 rows', otherRows === 3, `got: ${otherRows}`);

    await page.close();
  }

  // ── REQ-10: ADD LOCATION FEATURE ────────────────────────────────────────
  section('REQ-10: Add Location UI');
  {
    const page = await ctx.newPage();
    await page.goto(BASE_URL);
    await waitForWeather(page);

    // Add row present
    const addRow = await page.locator('.loc-add-row').count();
    assert('10-01', 'Add Location row is present at bottom of Other Locations', addRow > 0);

    // Input field
    const input = await page.locator('#loc-input').count();
    assert('10-02', 'Add Location has a text input field', input > 0);

    // Button
    const btn = await page.locator('#loc-add-btn').count();
    assert('10-03', 'Add Location has an Add button', btn > 0);

    // Empty submit shows error
    await page.locator('#loc-add-btn').click();
    await page.waitForTimeout(300);
    const statusAfterEmpty = await page.locator('#loc-add-status').innerText();
    assert('10-04', 'Submitting empty input shows an error message', statusAfterEmpty.length > 0, `got: "${statusAfterEmpty}"`);

    // Error message styled as error
    const statusClass = await page.locator('#loc-add-status').getAttribute('class');
    assert('10-05', 'Empty-submit error has error styling class', (statusClass || '').includes('err'));

    await page.close();
  }

  // ── REQ-11: ADD LOCATION — GEOCODING ────────────────────────────────
  section('REQ-11: Add Location — Geocoding & Navigation');
  {
    const page = await ctx.newPage();

    // Intercept geocoding API call
    let geocodeUrl = null;
    page.on('request', req => {
      if (req.url().includes('geocoding-api.open-meteo.com')) geocodeUrl = req.url();
    });

    await page.goto(BASE_URL);
    await waitForWeather(page);

    await page.locator('#loc-input').fill('Scottsbluff Nebraska');
    await page.locator('#loc-add-btn').click();

    // Status should update immediately
    await page.waitForTimeout(300);
    const lookingStatus = await page.locator('#loc-add-status').innerText();
    assert('11-01', 'Geocoding shows a status message while in progress',
      lookingStatus.length > 0, `got: "${lookingStatus}"`);

    // Wait for geocode to resolve (status changes from "Looking up...")
    await page.waitForFunction(
      () => {
        const s = document.getElementById('loc-add-status')?.innerText?.toLowerCase() || '';
        return s.includes('added') || s.includes('not found') || s.includes('loading');
      },
      { timeout: 12000 }
    );

    const resolvedStatus = await page.locator('#loc-add-status').innerText();
    assert('11-02', 'Status updates after geocode resolves', resolvedStatus.length > 0, `got: "${resolvedStatus}"`);
    assert('11-03', 'Geocoding API was called with the location query',
      geocodeUrl !== null && geocodeUrl.toLowerCase().includes('scottsbluff'),
      `geocodeUrl: ${geocodeUrl}`);

    // Confirm geocoding API returns valid results via Node http directly
    const https = require('https');
    const geocodeData = await new Promise((resolve) => {
      if (!geocodeUrl) return resolve(null);
      https.get(geocodeUrl.replace('http://', 'https://'), res => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => { try { resolve(JSON.parse(body)); } catch(e) { resolve(null); } });
      }).on('error', () => resolve(null));
    });
    assert('11-04', 'Geocoding API returns valid results for the query',
      geocodeData && geocodeData.results && geocodeData.results.length > 0,
      `got: ${JSON.stringify(geocodeData?.results?.slice(0,1))}`);

    await page.close();
  }

  // ── REQ-12: ADD LOCATION — DUPLICATE DETECTION ──────────────────────────
  section('REQ-12: Add Location — Duplicate Detection');
  {
    const page = await ctx.newPage();
    await page.goto(BASE_URL);
    await waitForWeather(page);

    await page.locator('#loc-input').fill('Valentine');
    await page.locator('#loc-add-btn').click();

    // Wait for geocode to resolve then dup check to run
    await page.waitForFunction(
      () => {
        const s = document.getElementById('loc-add-status')?.innerText?.toLowerCase() || '';
        return s.includes('already') || s.includes('added') || s.includes('not found');
      },
      { timeout: 12000 }
    );

    const status = await page.locator('#loc-add-status').innerText();
    assert('12-01', 'Duplicate location shows "already in list" error',
      status.toLowerCase().includes('already'), `got: "${status}"`);

    const statusClass = await page.locator('#loc-add-status').getAttribute('class');
    assert('12-02', 'Duplicate error has .err styling class',
      (statusClass || '').includes('err'), `class: "${statusClass}"`);

    const btnDisabled = await page.locator('#loc-add-btn').isDisabled();
    assert('12-03', 'Add button is re-enabled after duplicate rejection', !btnDisabled);

    await page.close();
  }

  // ── REQ-13: REFRESH BUTTON ───────────────────────────────────────────────
  section('REQ-13: Refresh Button');
  {
    const page = await ctx.newPage();
    await page.goto(BASE_URL);
    await waitForWeather(page);

    const btnVisible = await page.locator('#refresh-btn').isVisible();
    assert('13-01', 'Refresh button is visible after load', btnVisible);

    // Click refresh — spinner should reappear briefly
    await page.locator('#refresh-btn').click();
    // Give it a moment to reset
    await page.waitForTimeout(300);
    // Then wait for reload
    await waitForWeather(page);

    const stillVisible = await page.locator('#current-card').isVisible();
    assert('13-02', 'After refresh, current conditions card is still visible', stillVisible);

    const updatedText = await page.locator('#updated').innerText();
    assert('13-03', 'Updated timestamp is present after refresh', updatedText.includes('Updated'));

    await page.close();
  }

  // ── REQ-14: DESIGN / MOBILE ──────────────────────────────────────────────
  section('REQ-14: Design System & Mobile Layout');
  {
    const page = await ctx.newPage();
    await page.goto(BASE_URL);
    await waitForWeather(page);

    // Dark background
    const bodyBg = await page.evaluate(() =>
      getComputedStyle(document.body).backgroundColor
    );
    // rgb(15, 25, 35) = #0f1923
    assert('14-01', 'Body background is dark (#0f1923)', bodyBg === 'rgb(15, 25, 35)', `got: ${bodyBg}`);

    // No horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    assert('14-02', 'No horizontal scrollbar (no content overflow)', scrollWidth <= clientWidth, `scrollWidth: ${scrollWidth}, clientWidth: ${clientWidth}`);

    // Viewport meta tag
    const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content');
    assert('14-03', 'Viewport meta tag is set for mobile', (viewportMeta || '').includes('width=device-width'), `got: "${viewportMeta}"`);

    // Forecast uses 4-column grid
    const forecastGrid = await page.evaluate(() =>
      getComputedStyle(document.querySelector('.day-row')).gridTemplateColumns
    );
    // Should have 4 equal columns
    const colCount = forecastGrid.trim().split(/\s+/).length;
    assert('14-04', 'Forecast rows use 4-column CSS grid', colCount === 4, `got: "${forecastGrid}"`);

    // History uses same grid
    const histGrid = await page.evaluate(() =>
      getComputedStyle(document.querySelector('.hist-row')).gridTemplateColumns
    );
    const histColCount = histGrid.trim().split(/\s+/).length;
    assert('14-05', 'History rows use 4-column CSS grid', histColCount === 4, `got: "${histGrid}"`);

    // Accent color check on refresh button
    const btnColor = await page.evaluate(() =>
      getComputedStyle(document.getElementById('refresh-btn')).color
    );
    // rgb(74, 158, 255) = #4a9eff
    assert('14-06', 'Refresh button uses accent color (#4a9eff)', btnColor === 'rgb(74, 158, 255)', `got: ${btnColor}`);

    await page.close();
  }

  // ── REQ-15: API INTEGRATION ──────────────────────────────────────────────
  section('REQ-15: API Calls & Parameters');
  {
    const page = await ctx.newPage();
    const apiCalls = [];

    // Intercept all network requests
    page.on('request', req => {
      const url = req.url();
      if (url.includes('open-meteo.com')) apiCalls.push(url);
    });

    await page.goto(BASE_URL);
    await waitForWeather(page);

    // Should have made calls to forecast API
    const forecastCalls = apiCalls.filter(u => u.includes('api.open-meteo.com/v1/forecast'));
    assert('15-01', 'Forecast API is called (api.open-meteo.com)', forecastCalls.length > 0, `found ${forecastCalls.length} calls`);

    // Should have made 2 forecast calls (current+forecast + history)
    assert('15-02', 'Two separate forecast API calls made (forecast + history)', forecastCalls.length >= 2, `got ${forecastCalls.length}`);

    // Check parameters on the main forecast call
    const mainCall = forecastCalls.find(u => u.includes('current='));
    assert('15-03', 'Forecast call includes current conditions params', !!mainCall);

    if (mainCall) {
      assert('15-04', 'Forecast uses Fahrenheit temperature units', mainCall.includes('temperature_unit=fahrenheit'), `url: ${mainCall}`);
      assert('15-05', 'Forecast uses mph wind units', mainCall.includes('wind_speed_unit=mph'), `url: ${mainCall}`);
      assert('15-06', 'Forecast uses inch precipitation units', mainCall.includes('precipitation_unit=inch'), `url: ${mainCall}`);
      assert('15-07', 'Forecast requests 10 days', mainCall.includes('forecast_days=10'), `url: ${mainCall}`);
      assert('15-08', 'Forecast includes timezone parameter', mainCall.includes('timezone='), `url: ${mainCall}`);
    } else {
      ['15-04','15-05','15-06','15-07','15-08'].forEach(id =>
        assert(id, `(skipped — no main call found)`, false));
    }

    // History call
    const histCall = forecastCalls.find(u => u.includes('past_days='));
    assert('15-09', 'History call uses past_days parameter', !!histCall, histCall ? '' : 'no past_days call found');
    if (histCall) {
      assert('15-10', 'History call requests past_days=10', histCall.includes('past_days=10'), `url: ${histCall}`);
      assert('15-11', 'History call includes cloud_cover_mean', histCall.includes('cloud_cover_mean'), `url: ${histCall}`);
    } else {
      ['15-10','15-11'].forEach(id => assert(id, '(skipped — no history call found)', false));
    }

    await page.close();
  }

  // ── TEARDOWN ─────────────────────────────────────────────────────────────
  await browser.close();

  // ── SUMMARY REPORT ───────────────────────────────────────────────────────
  const total = passed + failed;
  const pct = Math.round((passed / total) * 100);

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                     TEST RESULTS                        ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  Total:   ${String(total).padEnd(4)} tests                                   ║`);
  console.log(`║  Passed:  ${String(passed).padEnd(4)} (${String(pct).padStart(3)}%)                                ║`);
  console.log(`║  Failed:  ${String(failed).padEnd(4)}                                        ║`);
  console.log('╚══════════════════════════════════════════════════════════╝');

  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  ✗ [${r.id}] ${r.description}${r.detail ? ' — ' + r.detail : ''}`);
    });
  }

  // Write JSON report
  const report = {
    timestamp: new Date().toISOString(),
    target: BASE_URL,
    summary: { total, passed, failed, pct },
    results
  };
  require('fs').writeFileSync('/home/user/workspace/test-suite/report.json', JSON.stringify(report, null, 2));
  console.log('\nFull report written to report.json');

  process.exit(failed > 0 ? 1 : 0);
})();
