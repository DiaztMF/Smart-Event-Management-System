<?php

namespace Database\Seeders;

use App\Models\EventCategory;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class EventCategorySeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        EventCategory::insert([
            ['name' => 'Seminar', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Workshop', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Konferensi', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Pelatihan', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
