<?php

namespace App\Http\Controllers\Security;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Log;

/**
 * CspViolationReportController
 * 
 * Nhận CSP violation reports từ browsers
 * Log lại để debug CSP issues
 */
class CspViolationReportController extends Controller
{
    /**
     * POST /api/csp-violation-report
     * 
     * Browser gửi CSP violation report khi có vi phạm policy
     * (unsafe inline script, external resource không trong allow-list, etc)
     */
    public function report(Request $request)
    {
        // CSP report body là JSON
        $data = $request->json()->all();

        // Extract key information
        $violation = [
            'timestamp' => now()->toIso8601String(),
            'user_agent' => $request->userAgent(),
            'ip' => $request->ip(),
            'violated_directive' => $data['csp-report']['violated-directive'] ?? 'unknown',
            'original_policy' => $data['csp-report']['original-policy'] ?? 'unknown',
            'blocked_uri' => $data['csp-report']['blocked-uri'] ?? 'unknown',
            'source_file' => $data['csp-report']['source-file'] ?? 'unknown',
            'line_number' => $data['csp-report']['line-number'] ?? 0,
            'column_number' => $data['csp-report']['column-number'] ?? 0,
            'document_uri' => $data['csp-report']['document-uri'] ?? 'unknown',
        ];

        // Log violation
        Log::warning('CSP Violation Detected', $violation);

        // Return 204 No Content (HTTP 204 = success, no body)
        return response('', 204);
    }
}
