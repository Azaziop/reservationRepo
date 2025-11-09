<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ReservationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Récupérer les IDs des employés créés
        $jean = \App\Models\User::where('employee_number', 'EMP001')->first();
        $marie = \App\Models\User::where('employee_number', 'EMP002')->first();
        $pierre = \App\Models\User::where('employee_number', 'EMP003')->first();
        $sophie = \App\Models\User::where('employee_number', 'EMP004')->first();
        $alexandre = \App\Models\User::where('employee_number', 'EMP005')->first();

        if (!$jean || !$marie || !$pierre || !$sophie || !$alexandre) {
            echo "Erreur: Tous les employés n'ont pas été trouvés\n";
            return;
        }

        $reservations = [
            [
                'employee_id' => $marie->id,
                'room_id' => 1, // CONF-001
                'date' => now()->addDays(1)->toDateString(),
                'start_time' => '09:00:00',
                'end_time' => '10:30:00',
                'duration_minutes' => 90,
                'purpose' => 'Réunion équipe RH',
                'status' => 'confirmed',
                'notes' => 'Préparation du plan de formation annuel'
            ],
            [
                'employee_id' => $jean->id,
                'room_id' => 4, // FORM-001
                'date' => now()->addDays(2)->toDateString(),
                'start_time' => '14:00:00',
                'end_time' => '17:00:00',
                'duration_minutes' => 180,
                'purpose' => 'Formation Laravel',
                'status' => 'confirmed',
                'notes' => 'Formation développement web pour l\'équipe'
            ],
            [
                'employee_id' => $pierre->id,
                'room_id' => 6, // BUR-101
                'date' => now()->toDateString(),
                'start_time' => '11:00:00',
                'end_time' => '12:00:00',
                'duration_minutes' => 60,
                'purpose' => 'Entretien client',
                'status' => 'confirmed',
                'notes' => 'Présentation commerciale'
            ],
            [
                'employee_id' => $sophie->id,
                'room_id' => 2, // CONF-002
                'date' => now()->addDays(3)->toDateString(),
                'start_time' => '10:00:00',
                'end_time' => '11:30:00',
                'duration_minutes' => 90,
                'purpose' => 'Stratégie marketing',
                'status' => 'confirmed',
                'notes' => 'Brainstorming campagne Q1'
            ],
            [
                'employee_id' => $alexandre->id,
                'room_id' => 7, // BUR-102
                'date' => now()->addDays(1)->toDateString(),
                'start_time' => '15:00:00',
                'end_time' => '16:00:00',
                'duration_minutes' => 60,
                'purpose' => 'Révision budget',
                'status' => 'confirmed',
                'notes' => 'Analyse financière trimestrielle'
            ]
        ];

        foreach ($reservations as $reservation) {
            \App\Models\Reservation::create($reservation);
        }
    }
}
