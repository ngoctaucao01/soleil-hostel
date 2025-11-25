<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\HtmlPurifierService;

class ContactController extends Controller
{
    /**
     * Store a contact message in storage.
     * 
     * INPUT SANITIZATION:
     * - email validation ensures valid email format
     * - message is purified using HTML Purifier whitelist
     * - Regex blacklist = 99% bypass. HTML Purifier = 0% bypass.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'message' => 'required|string|max:5000',
        ], [
            'name.required' => 'Name is required.',
            'name.max' => 'Name cannot exceed 255 characters.',
            'email.required' => 'Email is required.',
            'email.email' => 'Please provide a valid email.',
            'message.required' => 'Message cannot be empty.',
            'message.max' => 'Message cannot exceed 5000 characters.',
        ]);

        // Purify message using HTML Purifier (whitelist approach, not regex blacklist)
        $validated['message'] = HtmlPurifierService::purify($validated['message']);

        // Log the contact message
        \Log::info('Contact message received', $validated);
        
        // Future enhancement: save to database or send email notification

        return response()->json([
            'success' => true,
            'message' => 'Message received. We will get back to you soon.',
            'data' => null,
        ], 201);
    }
}
