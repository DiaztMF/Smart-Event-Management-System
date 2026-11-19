<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RegistrationController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

// Auth using Inertia-compatible controller (login page + session)
Route::get('/login', [AuthController::class, 'create'])->name('login');
Route::middleware('web')->group(function () {
    Route::post('/login', [AuthController::class, 'store'])->name('login.store');
    Route::post('/logout', [AuthController::class, 'destroy'])->name('logout');
});

// API profile - session-based auth (guard web)
Route::middleware('auth')->get('/api/profile', ProfileController::class)->name('profile');

// Data Master - public read, protected write
Route::get('/api/categories', [CategoryController::class, 'index'])->name('categories.index');
Route::middleware('auth')->group(function () {
    Route::post('/api/categories', [CategoryController::class, 'store'])->name('categories.store');
    Route::put('/api/categories/{id}', [CategoryController::class, 'update'])->name('categories.update');
    Route::delete('/api/categories/{id}', [CategoryController::class, 'destroy'])->name('categories.destroy');
});

// Events - public read, protected write
Route::get('/api/events', [EventController::class, 'index'])->name('events.index');
Route::get('/api/events/{id}', [EventController::class, 'show'])->name('events.show');
Route::middleware('auth')->group(function () {
    Route::post('/api/events', [EventController::class, 'store'])->name('events.store');
    Route::put('/api/events/{id}', [EventController::class, 'update'])->name('events.update');
    Route::delete('/api/events/{id}', [EventController::class, 'destroy'])->name('events.destroy');
    Route::get('/api/events/{id}/export', [EventController::class, 'export'])->name('events.export');
});

// Transaksi - protected
Route::middleware('auth')->group(function () {
    Route::post('/api/events/{id}/register', [RegistrationController::class, 'store'])->name('registrations.store');
    Route::get('/api/my-registrations', [RegistrationController::class, 'index'])->name('registrations.index');
    Route::put('/api/registrations/{id}/cancel', [RegistrationController::class, 'cancel'])->name('registrations.cancel');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::inertia('events/create', 'event-form')->name('events.create');
    Route::inertia('events/{id}/edit', 'event-form')->name('events.edit');
    Route::inertia('my-registrations', 'registrations')->name('registrations');
});

require __DIR__.'/settings.php';
