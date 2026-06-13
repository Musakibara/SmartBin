<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SensorReading extends Model
{
    /** @use HasFactory<\Database\Factories\SensorReadingFactory> */
    use HasFactory, HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'bin_id',
        'distance',
        'fill_level',
        'detected_presence',
    ];

    protected function casts(): array
    {
        return [
            'fill_level' => 'float',
            'distance' => 'float',
            'detected_presence' => 'boolean',
            'created_at' => 'datetime',
        ];
    }

    public function bin(): BelongsTo
    {
        return $this->belongsTo(Bin::class, 'bin_id');
    }
}
