<?php

namespace App\Http\Requests;

use App\Models\Event;
use App\Models\Registration;
use Illuminate\Validation\Validator;

class RegistrationStoreRequest extends ApiFormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [];
    }

    /**
     * Configure the validator instance.
     *
     * @param  \Illuminate\Validation\Validator  $validator
     * @return void
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $user = auth()->user();
            $eventId = (int) $this->route('id');

            $event = Event::whereNull('deleted_at')->find($eventId);

            if (!$event) {
                $validator->errors()->add('event', 'Event tidak ditemukan');

                return;
            }

            $exists = Registration::where('user_id', $user->id)
                ->where('event_id', $eventId)
                ->exists();

            if ($exists) {
                $validator->errors()->add('event', 'Anda telah terdaftar pada event ini');

                return;
            }

            $registeredCount = Registration::where('event_id', $eventId)
                ->where('status', 'registered')
                ->count();

            if ($registeredCount >= $event->quota) {
                $validator->errors()->add('quota', 'Quota event sudah penuh');
            }
        });
    }
}
