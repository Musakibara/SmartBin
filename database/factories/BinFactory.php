<?php

namespace Database\Factories;

use App\Models\Bin;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Bin>
 */
class BinFactory extends Factory
{
    protected $model = Bin::class;

    private static array $locations = [
        ['Mfoundi, Yaoundé', 3.8667, 11.5167],
        ['Bastos, Yaoundé', 3.8800, 11.5100],
        ['Mvog-Mbi, Yaoundé', 3.8500, 11.5000],
        ['Nlongkak, Yaoundé', 3.8700, 11.5200],
        ['Melen, Yaoundé', 3.8400, 11.4900],
        ['Biyem-Assi, Yaoundé', 3.8300, 11.4800],
        ['Ekounou, Yaoundé', 3.8100, 11.4700],
        ['Mokolo, Yaoundé', 3.8600, 11.5300],
        ['Obili, Yaoundé', 3.8750, 11.5050],
        ['Ngoa-Ekellé, Yaoundé', 3.8550, 11.5150],
        ['Mvog-Betsi, Yaoundé', 3.8450, 11.4950],
        ['Tsinga, Yaoundé', 3.8350, 11.4850],
        ['Mendong, Yaoundé', 3.8200, 11.4600],
        ['Efoulan, Yaoundé', 3.8050, 11.4550],
        ['Nkolbisson, Yaoundé', 3.8800, 11.4900],
        ['Mfandena, Yaoundé', 3.8650, 11.5250],
        ['Essos, Yaoundé', 3.8550, 11.5050],
        ['Nsam, Yaoundé', 3.8400, 11.5100],
        ['Ahala, Yaoundé', 3.7900, 11.4500],
        ['Nkolndongo, Yaoundé', 3.8600, 11.5000],
        ['Mimboman, Yaoundé', 3.8450, 11.4750],
        ['Etoudi, Yaoundé', 3.8900, 11.5150],
        ['Odza, Yaoundé', 3.8000, 11.4650],
        ['Mvan, Yaoundé', 3.8250, 11.4800],
    ];

    private static int $counter = 0;

    public function definition(): array
    {
        $idx = self::$counter % count(self::$locations);
        [$location, $lat, $lng] = self::$locations[$idx];
        self::$counter++;

        $fillLevel = fake()->numberBetween(0, 100);
        $status = match (true) {
            $fillLevel >= 85 => 'FULL',
            $fillLevel >= 60 => 'WARNING',
            default => 'NORMAL',
        };

        return [
            'code' => 'BIN-' . str_pad((string) self::$counter, 3, '0', STR_PAD_LEFT),
            'name' => fake()->word() . ' Bin',
            'location' => $location,
            'latitude' => $lat,
            'longitude' => $lng,
            'status' => $status,
            'fill_level' => $fillLevel,
            'lid_status' => fake()->randomElement(['OPEN', 'CLOSED']),
            'battery_level' => fake()->numberBetween(15, 100),
            'last_update' => fake()->dateTimeBetween('-1 hour'),
        ];
    }
}
