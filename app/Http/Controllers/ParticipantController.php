<?php
// app/Http/Controllers/ParticipantController.php
namespace App\Http\Controllers;
use Illuminate\Support\Facades\Auth;
use App\Models\Event;
use Illuminate\Http\Request;

class ParticipantController extends Controller
{
   public function store(Request $request, \App\Models\Event $event)
{
$event->participants()->syncWithoutDetaching([Auth::id()]);
    return back()->with('success', 'Inscription confirmée.');
}


    public function destroy(Request $request, Event $event)
    {
        $event->participants()->detach([Auth::id()]);

        return back()->with('success', 'Vous avez quitté cet événement.');
    }
}
