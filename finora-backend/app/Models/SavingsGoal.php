<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SavingsGoal extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'target_amount',
        'saved_amount',
        'target_date',
    ];

    protected function casts(): array
    {
        return [
            'target_amount' => 'decimal:2',
            'saved_amount' => 'decimal:2',
            'target_date' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
