<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class EventStoreRequest extends ApiFormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category_id' => 'required|exists:event_categories,id',
            'event_date' => 'required|date',
            'quota' => 'required|integer|min:1',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'title' => 'judul event',
            'description' => 'deskripsi',
            'category_id' => 'kategori',
            'event_date' => 'tanggal event',
            'quota' => 'kuota peserta',
        ];
    }
}
