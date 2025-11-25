<?php
// Quick test to see if Sanctum can find tokens created by our override

require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = \App\Models\User::firstOrCreate(
    ['email' => 'sanctum-test@example.com'],
    [
        'name' => 'Sanctum Test User',
        'password' => bcrypt('password'),
    ]
);

// Create a token using our override
$token = $user->createToken('Test Token', ['*'], now()->addHour());
$plainTextToken = $token->plainTextToken;

echo "Created token: " . substr($plainTextToken, 0, 20) . "...\n";
echo "Token ID: " . $token->accessToken->id . "\n";

// Now test if we can find it manually (like Sanctum does)
$foundToken = \App\Models\PersonalAccessToken::where(
    'token',
    hash('sha256', $plainTextToken)
)->first();

echo "Found token: " . ($foundToken ? $foundToken->id : 'NOT FOUND') . "\n";
if ($foundToken) {
    echo "Token user_id: " . $foundToken->user_id . "\n";
    echo "Token tokenable_id: " . $foundToken->tokenable_id . "\n";
}
?>
