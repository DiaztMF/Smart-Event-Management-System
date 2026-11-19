<?php

namespace App\Http\Controllers;

use App\Http\Requests\EventStoreRequest;
use App\Http\Requests\EventUpdateRequest;
use App\Models\Event;
use App\Models\Registration;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function index(Request $request)
    {
        $query = Event::with('category')->whereNull('deleted_at');

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        $events = $query->get()->map(function ($event) {
            return [
                'id' => $event->id,
                'title' => $event->title,
                'description' => $event->description,
                'category' => $event->category,
                'event_date' => $event->event_date,
                'quota' => $event->quota,
                'remaining_quota' => $event->quota - $event->registrations()->where('status', 'registered')->count(),
            ];
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Daftar event',
            'data' => $events,
        ]);
    }

    public function store(EventStoreRequest $request)
    {
        $event = Event::create($request->only([
            'title', 'description', 'category_id', 'event_date', 'quota',
        ]));

        return response()->json([
            'status' => 'success',
            'message' => 'Event berhasil ditambahkan',
            'data' => $event->load('category'),
        ], 201);
    }

    public function show($id)
    {
        $event = Event::with('category')->whereNull('deleted_at')->find($id);

        if (!$event) {
            return response()->json([
                'status' => 'error',
                'message' => 'Event tidak ditemukan',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Detail event',
            'data' => $event,
        ]);
    }

    public function update(EventUpdateRequest $request, $id)
    {
        $event = Event::find($id);

        if (!$event) {
            return response()->json([
                'status' => 'error',
                'message' => 'Event tidak ditemukan',
            ], 404);
        }

        $event->update($request->only([
            'title', 'description', 'category_id', 'event_date', 'quota',
        ]));

        return response()->json([
            'status' => 'success',
            'message' => 'Event berhasil diperbarui',
            'data' => $event->load('category'),
        ]);
    }

    public function destroy($id)
    {
        $event = Event::find($id);

        if (!$event) {
            return response()->json([
                'status' => 'error',
                'message' => 'Event tidak ditemukan',
            ], 404);
        }

        $event->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Event berhasil dihapus (soft delete)',
        ]);
    }

    public function export($id)
    {
        $event = Event::find($id);

        if (!$event) {
            return response()->json([
                'status' => 'error',
                'message' => 'Event tidak ditemukan',
            ], 404);
        }

        $registrations = $event->registrations()->with('user')->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="peserta-event-'.$id.'.csv"',
        ];

        $callback = function () use ($registrations) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['No', 'Nama', 'Email', 'Status', 'Tanggal Daftar']);

            $no = 1;
            foreach ($registrations as $registration) {
                fputcsv($handle, [
                    $no++,
                    $registration->user->name ?? '-',
                    $registration->user->email ?? '-',
                    $registration->status,
                    $registration->created_at,
                ]);
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }
}
