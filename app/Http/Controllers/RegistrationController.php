<?php

namespace App\Http\Controllers;

use App\Http\Requests\RegistrationStoreRequest;
use App\Models\Event;
use App\Models\Registration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RegistrationController extends Controller
{
    public function store(RegistrationStoreRequest $request, $id)
    {
        if (!Auth::check()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Silakan login terlebih dahulu',
            ], 401);
        }

        $event = Event::whereNull('deleted_at')->find($id);

        if (!$event) {
            return response()->json([
                'status' => 'error',
                'message' => 'Event tidak ditemukan',
            ], 404);
        }

        $registration = Registration::create([
            'user_id' => Auth::id(),
            'event_id' => $id,
            'status' => 'registered',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Pendaftaran berhasil',
            'data' => $registration->load('event'),
        ], 201);
    }

    public function index()
    {
        if (!Auth::check()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Silakan login terlebih dahulu',
            ], 401);
        }

        $registrations = Registration::where('user_id', Auth::id())
            ->with('event.category')
            ->latest()
            ->get();

        return response()->json([
            'status' => 'success',
            'message' => 'Riwayat pendaftaran',
            'data' => $registrations,
        ]);
    }

    public function cancel($id)
    {
        if (!Auth::check()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Silakan login terlebih dahulu',
            ], 401);
        }

        $registration = Registration::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();

        if (!$registration) {
            return response()->json([
                'status' => 'error',
                'message' => 'Pendaftaran tidak ditemukan',
            ], 404);
        }

        $registration->update(['status' => 'canceled']);

        return response()->json([
            'status' => 'success',
            'message' => 'Pendaftaran berhasil dibatalkan',
            'data' => $registration,
        ]);
    }
}
