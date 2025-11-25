<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\Room;
use App\Http\Requests\StoreReviewRequest;
use App\Http\Requests\UpdateReviewRequest;
use App\Services\HtmlPurifierService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;

/**
 * ReviewController - Example controller using HTML Purifier
 * 
 * Best practices demonstrated:
 * 1. Purify in FormRequest (auto-purification via ->validated())
 * 2. Rely on model Purifiable trait for safety
 * 3. Use @purify directive in Blade templates
 * 4. Log XSS attempts for monitoring
 * 5. Never use {!! $html !!} without confirmation content is purified
 */
class ReviewController extends Controller
{
    /**
     * Display a listing of reviews for a room
     * 
     * Example: GET /rooms/{room}/reviews
     */
    public function index(Room $room)
    {
        $reviews = $room->reviews()
            ->where('is_approved', true)
            ->latest('created_at')
            ->paginate(15);

        return view('reviews.index', [
            'room' => $room,
            'reviews' => $reviews,
        ]);
    }

    /**
     * Show the form for creating a new review
     * 
     * Example: GET /reviews/create?room_id=1
     */
    public function create(Request $request)
    {
        $room = Room::findOrFail($request->query('room_id'));

        Gate::authorize('create', [Review::class, $room]);

        return view('reviews.create', [
            'room' => $room,
        ]);
    }

    /**
     * Store a newly created review
     * 
     * Best Practice #1: Purification happens in StoreReviewRequest::validated()
     * 
     * Example: POST /reviews
     * Input:   { "title": "Great!", "content": "<b>Amazing</b><script>alert('xss')</script>", ... }
     * DB:      { "title": "Great!", "content": "<b>Amazing</b>", ... }
     */
    public function store(StoreReviewRequest $request)
    {
        // $validated already has content purified via ->purify(['content', 'title'])
        // in StoreReviewRequest::validated()
        $validated = $request->validated();

        // Additional purification example (optional, depends on form design)
        // $validated = $request->purifyAll(); // Purify all string fields

        // Best Practice #2: Model Purifiable trait provides extra safety
        // If content somehow wasn't purified above, trait catches it on save
        $review = Review::create([
            ...$validated,
            'room_id' => $request->room_id,
            'user_id' => auth()->id(),
            'guest_name' => auth()->user()->name,
        ]);

        // Log review creation for monitoring
        Log::info("Review created", [
            'review_id' => $review->id,
            'room_id' => $review->room_id,
            'rating' => $review->rating,
        ]);

        return redirect()
            ->route('rooms.show', $review->room_id)
            ->with('success', 'Review submitted! Waiting for approval.');
    }

    /**
     * Display the specified review
     * 
     * Example: GET /reviews/1
     */
    public function show(Review $review)
    {
        // Best Practice #3: Content is safe because:
        // A) Purified in FormRequest when created
        // B) Purified by model Purifiable trait on save
        // C) Never modified without purification
        
        return view('reviews.show', [
            'review' => $review,
        ]);
    }

    /**
     * Show the form for editing the specified review
     * 
     * Example: GET /reviews/1/edit
     */
    public function edit(Review $review)
    {
        Gate::authorize('update', $review);

        return view('reviews.edit', [
            'review' => $review,
        ]);
    }

    /**
     * Update the specified review
     * 
     * Example: PATCH /reviews/1
     */
    public function update(UpdateReviewRequest $request, Review $review)
    {
        Gate::authorize('update', $review);

        // Purification happens in UpdateReviewRequest::validated()
        $validated = $request->validated();

        // Model Purifiable trait re-purifies on update
        $review->update($validated);

        Log::info("Review updated", [
            'review_id' => $review->id,
            'fields' => array_keys($validated),
        ]);

        return redirect()
            ->route('reviews.show', $review->id)
            ->with('success', 'Review updated!');
    }

    /**
     * Remove the specified review
     * 
     * Example: DELETE /reviews/1
     */
    public function destroy(Review $review)
    {
        Gate::authorize('delete', $review);

        $review_id = $review->id;
        $review->delete();

        Log::info("Review deleted", [
            'review_id' => $review_id,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Review deleted!');
    }

    /**
     * Advanced: Import reviews with HTML purification
     * 
     * Example: POST /reviews/import
     * Shows batch processing with HtmlPurifierService
     */
    public function importReviews(Request $request)
    {
        Gate::authorize('admin');

        $csvData = $request->file('csv')->getContent();
        $lines = array_filter(explode("\n", $csvData));
        $imported = 0;
        $skipped = 0;

        foreach ($lines as $line) {
            [$title, $content, $rating] = str_getcsv($line);

            // Direct use of HtmlPurifierService for batch operations
            $cleanTitle = HtmlPurifierService::purify($title);
            $cleanContent = HtmlPurifierService::purify($content);

            // Additional validation
            if (strlen($cleanContent) < 10) {
                $skipped++;
                continue;
            }

            Review::create([
                'title' => $cleanTitle,
                'content' => $cleanContent,
                'rating' => (int) $rating,
                'room_id' => 1,
                'user_id' => auth()->id(),
                'guest_name' => auth()->user()->name,
                'is_approved' => false,
            ]);

            $imported++;
        }

        Log::info("Reviews imported", [
            'imported' => $imported,
            'skipped' => $skipped,
        ]);

        return redirect()->back()->with('success', "Imported $imported reviews, skipped $skipped.");
    }

    /**
     * Advanced: Detect potential XSS in pending reviews
     * 
     * Example: GET /reviews/audit
     * Shows how to monitor for XSS attempts
     */
    public function auditXssAttempts()
    {
        Gate::authorize('admin');

        $suspiciousReviews = Review::where('is_approved', false)
            ->get()
            ->filter(function ($review) {
                $original = $review->getRawOriginal('content');
                $purified = HtmlPurifierService::purify($original);
                
                // If content changed after purification, it had dangerous elements
                return $original !== $purified;
            });

        return view('reviews.audit', [
            'suspicious' => $suspiciousReviews,
            'total_pending' => Review::where('is_approved', false)->count(),
        ]);
    }
}
