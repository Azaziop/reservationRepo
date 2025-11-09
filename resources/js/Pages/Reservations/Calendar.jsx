import React, { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import SidebarLayout from '@/Layouts/Sidebar';

function useAuth() {
  const page = usePage();
  return { user: page?.props?.auth?.user ?? null };
}

// Fonction helper pour corriger automatiquement les heures inversées à l'affichage
function formatTimeRange(startTime, endTime) {
  if (!startTime || !endTime) return `${startTime || ''} - ${endTime || ''}`;

  const start = new Date(`1970-01-01T${startTime}`);
  const end = new Date(`1970-01-01T${endTime}`);

  if (start > end) {
    // Heures inversées détectées - afficher corrigées
    return `${endTime} - ${startTime}`;
  }
  // Affichage normal
  return `${startTime} - ${endTime}`;
}

export default function Calendar({ reservations, currentMonth, currentYear }) {
    const { user } = useAuth();
    const [viewMonth, setViewMonth] = useState(currentMonth);
    const [viewYear, setViewYear] = useState(currentYear);

    const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

    // Get first day of month and number of days
    const firstDay = new Date(viewYear, viewMonth - 1, 1);
    const lastDay = new Date(viewYear, viewMonth, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = (firstDay.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0

    // Generate calendar days
    const calendarDays = [];

    // Add empty cells for days before the first day of month
    for (let i = 0; i < startDay; i++) {
        calendarDays.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(day);
    }

    // Get reservations for a specific day
    const getReservationsForDay = (day) => {
        if (!day) return [];

        const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return reservations.filter(reservation => {
            const reservationDate = new Date(reservation.date).toISOString().split('T')[0];
            return reservationDate === dateStr;
        });
    };

    // Navigate months
    const goToPreviousMonth = () => {
        if (viewMonth === 1) {
            setViewMonth(12);
            setViewYear(viewYear - 1);
        } else {
            setViewMonth(viewMonth - 1);
        }
    };

    const goToNextMonth = () => {
        if (viewMonth === 12) {
            setViewMonth(1);
            setViewYear(viewYear + 1);
        } else {
            setViewMonth(viewMonth + 1);
        }
    };

    // Filter reservations for current viewing month
    const getCurrentMonthReservations = () => {
        return reservations.filter(reservation => {
            const reservationDate = new Date(reservation.date);
            return reservationDate.getMonth() + 1 === viewMonth &&
                   reservationDate.getFullYear() === viewYear;
        });
    };

    const currentMonthReservations = getCurrentMonthReservations();

    // Update URL when month/year changes
    useEffect(() => {
        const url = new URL(window.location.href);
        url.searchParams.set('month', viewMonth);
        url.searchParams.set('year', viewYear);
        window.history.replaceState({}, '', url.toString());
    }, [viewMonth, viewYear]);

    return (
        <SidebarLayout>
            <Head title="Calendrier des Réservations" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 border-b border-gray-200">
                            <h1 className="text-3xl font-bold text-gray-900">
                                Calendrier des Réservations
                            </h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Vue calendrier de toutes les réservations
                            </p>
                        </div>
                        <div className="p-6 text-gray-900">
                            {/* Calendar Header */}
                            <div className="flex justify-between items-center mb-8">
                                <button
                                    onClick={goToPreviousMonth}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Précédent
                                </button>

                                <div className="text-center">
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {monthNames[viewMonth - 1]} {viewYear}
                                    </h2>
                                    <p className="text-sm text-gray-600">
                                        {reservations.length} réservation{reservations.length !== 1 ? 's' : ''} ce mois
                                    </p>
                                </div>

                                <button
                                    onClick={goToNextMonth}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    Suivant
                                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>

                            {/* Calendar Grid */}
                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                {/* Days of week headers */}
                                <div className="grid grid-cols-7 bg-gray-50">
                                    {daysOfWeek.map(day => (
                                        <div key={day} className="p-3 text-center font-semibold text-gray-700 border-b border-gray-200">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar days */}
                                <div className="grid grid-cols-7">{calendarDays.map((day, index) => {
                                    const dayReservations = getReservationsForDay(day);
                                    const isToday = day &&
                                        new Date().getDate() === day &&
                                        new Date().getMonth() + 1 === viewMonth &&
                                        new Date().getFullYear() === viewYear;

                                    return (
                                        <div
                                            key={index}
                                            className={`min-h-[120px] p-2 border-b border-r border-gray-200 ${
                                                day ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                                            } ${isToday ? 'bg-blue-50 border-blue-200' : ''}`}
                                        >
                                            {day && (
                                                <>
                                                    <div className={`text-sm font-medium mb-1 ${
                                                        isToday ? 'text-blue-600' : 'text-gray-900'
                                                    }`}>
                                                        {day}
                                                        {isToday && (
                                                            <span className="ml-1 inline-flex items-center justify-center w-2 h-2 bg-blue-600 rounded-full">
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="space-y-1">
                                                        {dayReservations.slice(0, 2).map((reservation, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate"
                                                                title={`${reservation.room?.name || 'Salle'} - ${formatTimeRange(reservation.start_time, reservation.end_time)}`}
                                                            >
                                                                <div className="font-medium">
                                                                    {reservation.room?.name || 'Salle'}
                                                                </div>
                                                                <div>
                                                                    {formatTimeRange(reservation.start_time, reservation.end_time)}
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {dayReservations.length > 2 && (
                                                            <div className="text-xs text-gray-500 text-center bg-gray-100 rounded p-1">
                                                                +{dayReservations.length - 2} autres
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                                </div>
                            </div>

                            {/* Reservations List for Current Month */}
                            <div className="mt-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-semibold text-gray-900">
                                        Réservations de {monthNames[viewMonth - 1]} {viewYear}
                                    </h3>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                        {currentMonthReservations.length} réservation{currentMonthReservations.length !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                {currentMonthReservations.length > 0 ? (
                                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                        {currentMonthReservations.map(reservation => {
                                            const getStatusBadge = (status) => {
                                                const badges = {
                                                    'pending': 'bg-yellow-100 text-yellow-800',
                                                    'confirmed': 'bg-green-100 text-green-800',
                                                    'cancelled': 'bg-red-100 text-red-800',
                                                    'completed': 'bg-blue-100 text-blue-800',
                                                };
                                                return badges[status] || 'bg-gray-100 text-gray-800';
                                            };

                                            const getStatusLabel = (status) => {
                                                const labels = {
                                                    'pending': 'En attente',
                                                    'confirmed': 'Confirmée',
                                                    'cancelled': 'Annulée',
                                                    'completed': 'Terminée',
                                                };
                                                return labels[status] || status;
                                            };

                                            return (
                                                <div key={reservation.id} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900">
                                                                {reservation.room?.name || 'Salle inconnue'}
                                                            </h4>
                                                            <p className="text-sm text-gray-600">
                                                                {reservation.employee?.name || 'Employé inconnu'}
                                                            </p>
                                                        </div>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(reservation.status)}`}>
                                                            {getStatusLabel(reservation.status)}
                                                        </span>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="flex items-center text-sm text-gray-600">
                                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            {new Date(reservation.date).toLocaleDateString('fr-FR')}
                                                        </div>
                                                        <div className="flex items-center text-sm text-gray-600">
                                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            {formatTimeRange(reservation.start_time, reservation.end_time)}
                                                        </div>
                                                        {reservation.purpose && (
                                                            <div className="flex items-start text-sm text-gray-600">
                                                                <svg className="w-4 h-4 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                </svg>
                                                                {reservation.purpose}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <p className="text-gray-500">Aucune réservation pour ce mois</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </SidebarLayout>
    );
}
