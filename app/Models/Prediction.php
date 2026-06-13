<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Prediction extends Model
{
    /** @use HasFactory<\Database\Factories\PredictionFactory> */
    use HasFactory, HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'bin_id',
        'predicted_fill_time',
        'fill_probability',
        'risk_level',
        'recommendation',
    ];

    protected function casts(): array
    {
        return [
            'predicted_fill_time' => 'datetime',
            'fill_probability' => 'float',
        ];
    }

    public function bin(): BelongsTo
    {
        return $this->belongsTo(Bin::class, 'bin_id');
    }
}
