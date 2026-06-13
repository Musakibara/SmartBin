<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Bin extends Model
{
    /** @use HasFactory<\Database\Factories\BinFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'code',
        'name',
        'location',
        'latitude',
        'longitude',
        'status',
        'fill_level',
        'lid_status',
        'battery_level',
        'last_update',
    ];

    protected function casts(): array
    {
        return [
            'fill_level' => 'float',
            'battery_level' => 'float',
            'last_update' => 'datetime',
            'latitude' => 'float',
            'longitude' => 'float',
        ];
    }

    public function sensors(): HasMany
    {
        return $this->hasMany(Sensor::class, 'bin_id');
    }

    public function sensorReadings(): HasMany
    {
        return $this->hasMany(SensorReading::class, 'bin_id');
    }

    public function alerts(): HasMany
    {
        return $this->hasMany(Alert::class, 'bin_id');
    }

    public function predictions(): HasMany
    {
        return $this->hasMany(Prediction::class, 'bin_id');
    }
}
