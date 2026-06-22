<?php

namespace App\Mail;

use App\Models\Notification;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AlertNotification extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Notification $notification,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "SmartBin - Alerte : {$this->notification->message}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.alert',
        );
    }
}
