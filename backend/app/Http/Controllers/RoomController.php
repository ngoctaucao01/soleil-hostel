<?php

namespace App\Http\Controllers;

use App\Models\Room;
use Illuminate\Http\Request;
use App\Http\Requests\RoomRequest;
use Illuminate\Http\JsonResponse;

class RoomController extends Controller
{
    // List all rooms
    public function index(): JsonResponse
    {
        $rooms = Room::all();
        return response()->json([
            'success' => true,
            'message' => 'Room list fetched successfully',
            'data' => $rooms
        ]);
    }

    // Show a single room
    public function show($id): JsonResponse
    {
        $room = Room::find($id);
        if (!$room) {
            return response()->json([
                'success' => false,
                'message' => 'Room not found',
            ], 404);
        }
        return response()->json([
            'success' => true,
            'message' => 'Room fetched successfully',
            'data' => $room
        ]);
    }

    // Store a new room
    public function store(RoomRequest $request): JsonResponse
    {
        // Use policy to check authorization
        $this->authorize('create', Room::class);
        
        $room = Room::create($request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Room created successfully',
            'data' => $room
        ], 201);
    }

    // Update a room
    public function update(RoomRequest $request, $id): JsonResponse
    {
        $room = Room::find($id);
        if (!$room) {
            return response()->json([
                'success' => false,
                'message' => 'Room not found',
            ], 404);
        }

        // Use policy to check authorization
        $this->authorize('update', $room);
        
        $room->update($request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Room updated successfully',
            'data' => $room
        ]);
    }

    // Delete a room
    public function destroy($id): JsonResponse
    {
        $room = Room::find($id);
        if (!$room) {
            return response()->json([
                'success' => false,
                'message' => 'Room not found',
            ], 404);
        }

        // Use policy to check authorization
        $this->authorize('delete', $room);
        
        $room->delete();
        return response()->json([
            'success' => true,
            'message' => 'Room deleted successfully',
        ]);
    }
}