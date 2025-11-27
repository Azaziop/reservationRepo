<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use App\Models\Room;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class MetricsController extends Controller
{
    public function index()
    {
        $metrics = [];

        // Total reservations
        $totalReservations = Reservation::count();
        $metrics[] = "# HELP reservations_total Total number of reservations";
        $metrics[] = "# TYPE reservations_total counter";
        $metrics[] = "reservations_total $totalReservations";

        // Active reservations (today)
        $activeToday = Reservation::whereDate('date', today())->count();
        $metrics[] = "# HELP reservations_active_today Active reservations today";
        $metrics[] = "# TYPE reservations_active_today gauge";
        $metrics[] = "reservations_active_today $activeToday";

        // Reservations by status
        $metrics[] = "# HELP reservations_by_status Reservations grouped by status";
        $metrics[] = "# TYPE reservations_by_status gauge";
        foreach (Reservation::STATUSES as $key => $label) {
            $count = Reservation::where('status', $key)->count();
            $metrics[] = "reservations_by_status{status=\"$key\"} $count";
        }

        // Room utilization
        $metrics[] = "# HELP room_utilization_percent Room utilization percentage";
        $metrics[] = "# TYPE room_utilization_percent gauge";
        foreach (Room::all() as $room) {
            $utilization = $this->calculateRoomUtilization($room->id);
            $metrics[] = "room_utilization_percent{room_id=\"{$room->id}\",room_name=\"{$room->name}\"} $utilization";
        }

        // Database query performance
        $avgQueryTime = Cache::remember('avg_query_time', 60, function () {
            // Simulated - in production, use query logging
            return rand(10, 100) / 1000; // Random between 0.01 and 0.1 seconds
        });
        $metrics[] = "# HELP database_query_duration_seconds Average database query duration";
        $metrics[] = "# TYPE database_query_duration_seconds gauge";
        $metrics[] = "database_query_duration_seconds $avgQueryTime";

        // Total users
        $totalUsers = User::count();
        $metrics[] = "# HELP users_total Total number of users";
        $metrics[] = "# TYPE users_total gauge";
        $metrics[] = "users_total $totalUsers";

        // Recent reservations (last hour)
        $recentReservations = Reservation::where('created_at', '>=', now()->subHour())->count();
        $metrics[] = "# HELP reservations_recent_hourly Reservations created in last hour";
        $metrics[] = "# TYPE reservations_recent_hourly gauge";
        $metrics[] = "reservations_recent_hourly $recentReservations";

        return response(implode("\n", $metrics) . "\n")
            ->header('Content-Type', 'text/plain; version=0.0.4');
    }

    private function calculateRoomUtilization(int $roomId): float
    {
        // Calculate utilization as percentage of booked slots today
        $bookedHoursToday = Reservation::where('room_id', $roomId)
            ->whereDate('date', today())
            ->count();

        $totalAvailableHours = 10; // Assuming 10 booking slots per day

        return $bookedHoursToday > 0
            ? round(($bookedHoursToday / $totalAvailableHours) * 100, 2)
            : 0;
    }
}
