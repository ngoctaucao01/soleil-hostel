<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBookingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'room_id' => 'required|integer|exists:rooms,id',
            'check_in' => 'required|date_format:Y-m-d|after:today',
            'check_out' => 'required|date_format:Y-m-d|after:check_in',
            'guest_name' => 'required|string|min:2|max:255',
            'guest_email' => 'required|email|max:255'
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'room_id.required' => 'Room is required.',
            'room_id.exists' => 'Selected room does not exist.',
            'check_in.required' => 'Check-in date is required.',
            'check_in.after' => 'Check-in date must be after today.',
            'check_out.required' => 'Check-out date is required.',
            'check_out.after' => 'Check-out date must be after check-in date.',
            'guest_name.required' => 'Guest name is required.',
            'guest_name.min' => 'Guest name must be at least 2 characters.',
            'guest_name.max' => 'Guest name cannot exceed 255 characters.',
            'guest_email.required' => 'Guest email is required.',
            'guest_email.email' => 'Guest email must be a valid email address.',
        ];
    }

    /**
     * Get the validated data from the request.
     * 
     * ✅ HTML Purifier: Sanitize guest_name to prevent XSS
     * Uses whitelist approach (safe) not blacklist (regex) ❌
     * 
     * @return array<string, mixed>
     */
    public function validated(): array
    {
        // Purify HTML fields using FormRequest macro
        // This is safe because it uses HTML Purifier whitelist
        return $this->purify(['guest_name']);
    }
}
