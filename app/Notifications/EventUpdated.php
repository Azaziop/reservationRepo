<?php
// app/Notifications/EventUpdated.php
namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue; // optionnel mais recommandé
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Event;

class EventUpdated extends Notification implements ShouldQueue // queue recommandée
{
    use Queueable;

    public function __construct(public Event $event) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Mise à jour: '.$this->event->title)
            ->greeting('Bonjour '.$notifiable->name.',')
            ->line('L’événement a été mis à jour:')
            ->line('• Titre: '.$this->event->title)
            ->line('• Date: '.$this->event->date->format('d/m/Y H:i'))
            ->line('• Lieu: '.$this->event->location)
            ->action('Voir l’événement', url('/events/'.$this->event->id))
            ->line('Merci de votre participation.');
    }

    public function toArray(object $notifiable): array
    {
        return ['event_id' => $this->event->id];
    }
}
