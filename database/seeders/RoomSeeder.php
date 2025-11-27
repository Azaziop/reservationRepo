<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RoomSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $rooms = [
            [
                'room_number' => 'CONF-001',
                'capacity' => 20,
                'type' => 'conference',
                'description' => 'Grande salle de conférence avec équipement audiovisuel complet'
            ],
            [
                'room_number' => 'CONF-002',
                'capacity' => 12,
                'type' => 'conference',
                'description' => 'Salle de conférence moyenne avec écran et vidéoprojecteur'
            ],
            [
                'room_number' => 'CONF-003',
                'capacity' => 8,
                'type' => 'conference',
                'description' => 'Petite salle de conférence pour réunions intimes'
            ],
            [
                'room_number' => 'FORM-001',
                'capacity' => 25,
                'type' => 'training',
                'description' => 'Salle de formation avec disposition en U et équipement informatique'
            ],
            [
                'room_number' => 'FORM-002',
                'capacity' => 15,
                'type' => 'training',
                'description' => 'Salle de formation avec tableau interactif'
            ],
            [
                'room_number' => 'BUR-101',
                'capacity' => 4,
                'type' => 'office',
                'description' => 'Bureau privé pour entretiens confidentiels'
            ],
            [
                'room_number' => 'BUR-102',
                'capacity' => 6,
                'type' => 'office',
                'description' => 'Bureau d\'équipe avec espace de travail collaboratif'
            ],
            [
                'room_number' => 'BUR-103',
                'capacity' => 2,
                'type' => 'office',
                'description' => 'Petit bureau pour entretiens individuels'
            ],
            [
                'room_number' => 'CONF-004',
                'capacity' => 30,
                'type' => 'conference',
                'description' => 'Amphithéâtre pour grandes présentations'
            ],
            [
                'room_number' => 'FORM-003',
                'capacity' => 20,
                'type' => 'training',
                'description' => 'Salle de formation avec laboratoire informatique'
            ]
        ];

        foreach ($rooms as $room) {
            \App\Models\Room::create($room);
        }
    }
}
