<?php
// submit.php — WeatherPage.info
// Creates a .dat file and a personalized weather .html file for a given city/state + phone number.

header('Content-Type: application/json');

// ── Input ──────────────────────────────────────────────────────
$city_state = trim($_POST['city_state'] ?? '');
$phone      = trim($_POST['phone']      ?? '');

if (!$city_state || !$phone) {
    echo json_encode(['ok' => false, 'error' => 'Missing city/state or phone number.']);
    exit;
}

// ── Sanitize phone → digits only for filename ──────────────────
$phone_digits = preg_replace('/\D/', '', $phone);
if (strlen($phone_digits) < 10 || strlen($phone_digits) > 11) {
    echo json_encode(['ok' => false, 'error' => 'Invalid phone number.']);
    exit;
}

// ── Geocode city/state via Open-Meteo ─────────────────────────
$geo_name = urlencode($city_state);
$geo_url  = "https://geocoding-api.open-meteo.com/v1/search?name={$geo_name}&count=1&language=en&format=json";
$geo_json = file_get_contents($geo_url);
$geo      = json_decode($geo_json, true);

if (empty($geo['results'][0])) {
    echo json_encode(['ok' => false, 'error' => 'Could not find that city. Please check the spelling.']);
    exit;
}

$result   = $geo['results'][0];
$lat      = $result['latitude'];
$lon      = $result['longitude'];
$tz       = $result['timezone']      ?? 'America/Chicago';
$name     = $result['name']          ?? $city_state;
$state    = $result['admin1']        ?? '';
$location = $state ? "{$name}, {$state}" : $name;
$country  = $result['country_code']  ?? 'US';
$elev     = isset($result['elevation']) ? round($result['elevation'] * 3.28084) . ' ft' : '';
$sub      = $state ? "{$state} · Elev. {$elev}" : $elev;

// ── Write .dat file ───────────────────────────────────────────
$dat_dir = __DIR__ . '/dat';
if (!is_dir($dat_dir)) mkdir($dat_dir, 0755, true);

$dat_file = "{$dat_dir}/{$phone_digits}.dat";
$dat_contents = "city_state={$city_state}\nphone={$phone}\nlat={$lat}\nlon={$lon}\ntimezone={$tz}\nlocation={$location}\n";
file_put_contents($dat_file, $dat_contents);

// ── Build personalized weather page from template ─────────────
$template = file_get_contents(__DIR__ . '/template.html');

// Replace the config block values
$template = preg_replace('/const LAT\s*=\s*[^;]+;/',           "const LAT           = {$lat};",       $template);
$template = preg_replace('/const LON\s*=\s*[^;]+;/',           "const LON           = {$lon};",       $template);
$template = preg_replace('/const TZ\s*=\s*"[^"]*";/',          "const TZ            = \"{$tz}\";",    $template);
$template = preg_replace('/const LOCATION_NAME\s*=\s*"[^"]*";/', "const LOCATION_NAME = \"{$location}\";", $template);
$template = preg_replace('/const LOCATION_SUB\s*=\s*"[^"]*";/',  "const LOCATION_SUB  = \"{$sub}\";",     $template);
// Update page title
$template = str_replace('<title id="page-title">Weather</title>', "<title>{$location} Weather</title>", $template);

// ── Write .html file ──────────────────────────────────────────
$html_file = __DIR__ . "/{$phone_digits}.html";
file_put_contents($html_file, $template);

// ── Return success ────────────────────────────────────────────
$page_url = "https://weatherpage.info/{$phone_digits}.html";
echo json_encode([
    'ok'       => true,
    'location' => $location,
    'url'      => $page_url,
]);
