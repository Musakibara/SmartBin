<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Alert extends Model
{
    /** @use HasFactory<\Database\Factories\AlertFactory> */
    use HasFactory, HasUuids;

    public $timestamps = false;

    const CREATED_AT = 'created_at';

    protected $fillable = [
        'bin_id',
        'type',
        'message',
        'severity',
        'status',
        'resolved_by',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'created_at'  => 'datetime',
            'updated_at'  => 'datetime',
            'resolved_at' => 'datetime',
        ];
    }

    public function bin(): BelongsTo
    {
        return $this->belongsTo(Bin::class, 'bin_id');
    }

    public function resolvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class, 'alert_id');
    }
}
