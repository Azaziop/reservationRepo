<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\MetricsController;

// Define route constants - only if not already defined
if (!defined('PROFILE_ROUTE')) {
    define('PROFILE_ROUTE', '/profile');
}

// Accueil public (landing) — affiche le système de réservation
Route::get('/', [ReservationController::class, 'home'])->name('home');

// Metrics endpoint for Prometheus/Grafana
Route::get('/metrics', [MetricsController::class, 'index'])->name('metrics');

// Dashboard (protégé) — via contrôleur pour charger les données nécessaires

// Profil (protégé)
Route::middleware('auth')->group(function () {
    Route::get(PROFILE_ROUTE, [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch(PROFILE_ROUTE, [ProfileController::class, 'update'])->name('profile.update');
    Route::delete(PROFILE_ROUTE, [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Système de réservation de salles (protégées)
Route::middleware(['auth', 'verified'])->group(function () {
    // Gestion des salles
    Route::resource('rooms', RoomController::class);
    Route::post('rooms/{room}/check-availability', [RoomController::class, 'checkAvailability'])->name('rooms.check-availability');

    // Gestion des réservations
    Route::resource('reservations', ReservationController::class);
    Route::post('reservations/{reservation}/cancel', [ReservationController::class, 'cancel'])->name('reservations.cancel');
    Route::get('/calendar', [ReservationController::class, 'calendar'])->name('reservations.calendar');
    Route::get('rooms/{room}/reservations', [RoomController::class, 'reservations'])->name('rooms.reservations');
});

// Zone Admin (protégée par Gate/Policy)
Route::middleware(['auth', 'can:admin-only'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        // Gestion des utilisateurs/employés
        Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
        Route::get('/users/create', [AdminUserController::class, 'create'])->name('users.create');
        Route::post('/users', [AdminUserController::class, 'store'])->name('users.store');
        Route::get('/users/{user}/edit', [AdminUserController::class, 'edit'])->name('users.edit');
        Route::put('/users/{user}', [AdminUserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [AdminUserController::class, 'destroy'])->name('users.destroy');

        // Gestion des salles (admin)
        Route::resource('rooms', RoomController::class, ['except' => ['show']]);

        // Statistiques et rapports
        Route::get('/dashboard', function () {
            return Inertia::render('Admin/Dashboard');
        })->name('dashboard');
    });
Route::get('/dashboard', [ReservationController::class, 'dashboard'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');


// Auth scaffolding (Breeze/Fortify)
require __DIR__ . '/auth.php';
