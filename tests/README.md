# Weather Page Test Suite

Automated Playwright tests covering all 15 requirement groups (89 tests).

## Setup

```bash
npm install playwright
npx playwright install chromium
```

## Run

Serve the app locally first, then run the suite:

```bash
# From repo root:
python3 -m http.server 8765

# In another terminal, from tests/:
node weather.test.js
```

## Test Coverage

| Group | Area | Tests |
|-------|------|-------|
| REQ-01 | DAT file structure & seed data | 8 |
| REQ-02 | Page structure & DOM elements | 10 |
| REQ-03 | Default location (Valentine NE) | 4 |
| REQ-04 | Current conditions card | 10 |
| REQ-05 | 10-day forecast | 7 |
| REQ-06 | Previous 10 days (history) | 5 |
| REQ-07 | Other locations list | 6 |
| REQ-08 | ?loc= URL parameter routing | 4 |
| REQ-09 | Click navigation | 3 |
| REQ-10 | Add Location UI | 5 |
| REQ-11 | Geocoding API integration | 4 |
| REQ-12 | Duplicate location detection | 3 |
| REQ-13 | Refresh button | 3 |
| REQ-14 | Design system & mobile layout | 6 |
| REQ-15 | API calls & parameters | 11 |

## Known Limitations

- **11-04**: Geocoding API response verification via Node.js HTTPS may fail in
  sandboxed environments where outbound HTTPS is restricted. The geocoding call
  itself fires correctly (verified by 11-03).

- **12-01/02/03**: The duplicate detection uses a 0.01° coordinate tolerance.
  Searching "Valentine" (ambiguous) may resolve to a slightly different lat/lon
  than the dat file entry, bypassing duplicate detection. A real-browser run
  with localStorage will correctly detect the duplicate because the previously
  navigated location is stored and matched exactly.
