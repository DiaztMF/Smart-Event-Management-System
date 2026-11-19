<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProfileController extends Controller
{
    public function __invoke(Request $request)
    {
        return response()->json([
            'status' => 'success',
            'message' => 'Profil pengguna',
            'data' => $request->user(),
        ]);
    }
}
