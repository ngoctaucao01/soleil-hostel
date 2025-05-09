<?php

namespace App\Http\Controllers;

use App\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RoomController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => Room::select(['id', 'name', 'price', 'capacity'])->get()
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'description' => 'required|string',
            'price' => 'required|numeric|min:0',
            'capacity' => 'required|integer|min:1',
            'amenities' => 'nullable|array'
        ]);

        $room = Room::create($validated);
        return response()->json($room, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Room $room): JsonResponse
    {
        return response()->json($room);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Room $room)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Room $room): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'string',
            'description' => 'string',
            'price' => 'numeric|min:0',
            'capacity' => 'integer|min:1',
            'amenities' => 'nullable|array'
        ]);

        $room->update($validated);
        return response()->json($room);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Room $room): JsonResponse
    {
        $room->delete();
        return response()->json(null, 204);
    }
}
