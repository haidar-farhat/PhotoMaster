<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('pictures', function (Blueprint $table) {
            $table->string('thumbnail_path')->nullable()->after('path');
            $table->string('thumbnail_url')->nullable()->after('url');
            $table->unsignedBigInteger('file_size')->nullable()->after('thumbnail_url');
            $table->string('mime_type')->nullable()->after('file_size');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pictures', function (Blueprint $table) {
            $table->dropColumn('thumbnail_path');
            $table->dropColumn('thumbnail_url');
            $table->dropColumn('file_size');
            $table->dropColumn('mime_type');
        });
    }
};
