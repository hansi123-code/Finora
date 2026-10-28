
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('budgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('category');
            $table->decimal('amount', 12, 2);
            $table->decimal('spent', 12, 2)->default(0);
            $table->string('period')->default('monthly');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('budgets');
    }
};
