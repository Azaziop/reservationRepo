<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class EmployeeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $employees = [
            [
                'name' => 'Dupont',
                'first_name' => 'Jean',
                'employee_number' => 'EMP001',
                'department' => 'Informatique',
                'email' => 'jean.dupont@entreprise.com',
                'password' => bcrypt('password'),
                'role' => 'employee'
            ],
            [
                'name' => 'Martin',
                'first_name' => 'Marie',
                'employee_number' => 'EMP002',
                'department' => 'Ressources Humaines',
                'email' => 'marie.martin@entreprise.com',
                'password' => bcrypt('password'),
                'role' => 'employee'
            ],
            [
                'name' => 'Durand',
                'first_name' => 'Pierre',
                'employee_number' => 'EMP003',
                'department' => 'Commercial',
                'email' => 'pierre.durand@entreprise.com',
                'password' => bcrypt('password'),
                'role' => 'employee'
            ],
            [
                'name' => 'Leroy',
                'first_name' => 'Sophie',
                'employee_number' => 'EMP004',
                'department' => 'Marketing',
                'email' => 'sophie.leroy@entreprise.com',
                'password' => bcrypt('password'),
                'role' => 'employee'
            ],
            [
                'name' => 'Moreau',
                'first_name' => 'Alexandre',
                'employee_number' => 'EMP005',
                'department' => 'Finance',
                'email' => 'alexandre.moreau@entreprise.com',
                'password' => bcrypt('password'),
                'role' => 'employee'
            ],
            [
                'name' => 'Bernard',
                'first_name' => 'Julie',
                'employee_number' => 'MAN001',
                'department' => 'Direction',
                'email' => 'julie.bernard@entreprise.com',
                'password' => bcrypt('password'),
                'role' => 'admin'
            ]
        ];

        foreach ($employees as $employee) {
            \App\Models\User::create($employee);
        }
    }
}
