<?php

namespace Database\Factories;

use App\Models\Bin;
use Illuminate\Database\Eloquent\Factories\Factory;

class BinFactory extends Factory
{
    protected $model = Bin::class;

    public function definition(): array
    {
        $fill = $this->faker->numberBetween(5, 100);
        return [
            'code'           => 'BIN-' . str_pad($this->faker->unique()->numberBetween(1, 999), 3, '0', STR_PAD_LEFT),
            'name'           => $this->faker->randomElement([
                'Benne Mvog-Mbi', 'Benne Bastos', 'Benne Biyem-Assi',
                'Benne Nlongkak', 'Benne Mfoundi', 'Benne Mokolo',
                'Benne Briqueterie', 'Benne Mendong', 'Benne Etoudi',
                'Benne Nsam', 'Benne Obobogo', 'Benne Nkolbisson',
                'Benne Emana', 'Benne Melen', 'Benne Ekounou',
                'Benne Mvan', 'Benne Oyom-Abang', 'Benne Ngoa-Ekélé',
                'Benne Nikolisson', 'Benne Omnisport',
            ]),
            'location'       => $this->faker->randomElement([
                'Rue de la Paix', 'Avenue Kennedy', 'Boulevard de la République',
                'Quartier Administratif', 'Zone Industrielle', 'Marché Central',
                'Gare Routière', 'Campus Université', 'Hôpital Général',
                'Place de l\'Indépendance',
            ]),
            'latitude'       => 3.848 + $this->faker->randomFloat(6, -0.05, 0.05),
            'longitude'      => 11.502 + $this->faker->randomFloat(6, -0.05, 0.05),
            'status'         => $fill >= 80 ? 'FULL' : ($fill >= 60 ? 'WARNING' : 'NORMAL'),
            'fill_level'     => $fill,
            'lid_status'     => $this->faker->randomElement(['OPEN', 'CLOSED']),
            'battery_level'  => $this->faker->numberBetween(15, 100),
            'last_update'    => $this->faker->dateTimeBetween('-7 days', 'now'),
        ];
    }
}
