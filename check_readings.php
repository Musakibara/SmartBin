<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$count = App\Models\Bin::where('code', 'BIN-025')->count();
echo "Bins found: $count\n";

$bin = App\Models\Bin::where('code', 'BIN-025')->first();
if ($bin) {
    echo json_encode([
        'id' => $bin->id,
        'code' => $bin->code,
        'lat' => $bin->latitude,
        'lng' => $bin->longitude,
        'fill_level' => $bin->fill_level,
        'status' => $bin->status,
    ]) . "\n";
} else {
    echo "BIN-025 not found. Creating...\n";
    $bin = App\Models\Bin::create([
        'code' => 'BIN-025',
        'name' => 'Nouvelle Benne',
        'location' => 'Mvog-Mbi, Yaoundé',
        'latitude' => 3.926970531595633,
        'longitude' => 11.55919170250137,
        'status' => 'NORMAL',
        'fill_level' => 0,
        'lid_status' => 'CLOSED',
        'battery_level' => 100,
    ]);
    echo "Created: " . $bin->code . "\n";
}
