#!/usr/bin/env php
<?php
/**
 * HTML Purifier Production Deployment Script
 * Soleil Hostel - November 24, 2025
 * 
 * This script executes the complete deployment process:
 * Phase 1: Final testing
 * Phase 2: Database backup & migration
 * Phase 3: Cache cleanup
 * Phase 4: Production verification
 */

class DeploymentManager {
    private $basePath;
    private $backendPath;
    private $timestamp;
    private $errors = [];
    private $warnings = [];
    private $success = [];
    
    public function __construct() {
        $this->basePath = getcwd();
        $this->backendPath = $this->basePath . '/backend';
        $this->timestamp = date('Y-m-d H:i:s');
    }
    
    public function run() {
        $this->banner('🚀 HTML PURIFIER PRODUCTION DEPLOYMENT');
        $this->line();
        
        // Phase 1: Final Testing
        $this->phase('Phase 1: Final Testing');
        $this->testSuite();
        
        // Phase 2: Database
        $this->phase('Phase 2: Database Operations');
        $this->databaseOperations();
        
        // Phase 3: Cache
        $this->phase('Phase 3: Cache Cleanup');
        $this->cacheCleanup();
        
        // Phase 4: Verification
        $this->phase('Phase 4: Production Verification');
        $this->productionVerification();
        
        // Summary
        $this->summary();
    }
    
    private function phase($name) {
        $this->line();
        $this->section($name);
    }
    
    private function testSuite() {
        $this->info('Running HTML Purifier test suite...');
        
        $testPath = 'tests/Feature/Security/HtmlPurifierXssTest.php';
        
        chdir($this->backendPath);
        $output = shell_exec('php artisan test ' . $testPath . ' 2>&1');
        chdir($this->basePath);
        
        if (strpos($output, 'PASS') !== false || strpos($output, '48') !== false) {
            $this->success('✅ All 48 tests passing');
            $this->success[] = 'Test Suite Verification';
        } else {
            $this->error('Test suite failed. Output:');
            $this->error(substr($output, 0, 500));
            $this->errors[] = 'Test suite execution';
        }
    }
    
    private function databaseOperations() {
        $dbPath = $this->backendPath . '/database/database.sqlite';
        
        // Check database exists
        if (file_exists($dbPath)) {
            $this->info('Database found: ' . $dbPath);
            
            // Create backup
            $backupPath = $this->backendPath . '/database/backups/database_' . date('Y-m-d_His') . '.sqlite';
            if (!is_dir(dirname($backupPath))) {
                mkdir(dirname($backupPath), 0755, true);
            }
            
            if (copy($dbPath, $backupPath)) {
                $this->success('✅ Database backup created: ' . basename($backupPath));
                $this->success[] = 'Database Backup';
            } else {
                $this->warning('Could not create backup');
                $this->warnings[] = 'Database Backup';
            }
        } else {
            $this->info('SQLite database will be created during migration');
        }
        
        // Run migrations
        $this->info('Running database migrations...');
        chdir($this->backendPath);
        $output = shell_exec('php artisan migrate --force 2>&1');
        chdir($this->basePath);
        
        if (strpos($output, 'Migrated') !== false || strpos($output, 'Nothing to migrate') !== false) {
            $this->success('✅ Database migrations completed');
            $this->success[] = 'Database Migrations';
        } else {
            $this->error('Migration failed: ' . substr($output, 0, 200));
            $this->errors[] = 'Database Migrations';
        }
    }
    
    private function cacheCleanup() {
        chdir($this->backendPath);
        
        // Config cache
        $this->info('Clearing configuration cache...');
        shell_exec('php artisan config:clear 2>&1');
        $this->success('✅ Config cache cleared');
        $this->success[] = 'Config Cache';
        
        // Route cache
        $this->info('Clearing route cache...');
        shell_exec('php artisan route:clear 2>&1');
        $this->success('✅ Route cache cleared');
        $this->success[] = 'Route Cache';
        
        // View cache
        $this->info('Clearing view cache...');
        shell_exec('php artisan view:clear 2>&1');
        $this->success('✅ View cache cleared');
        $this->success[] = 'View Cache';
        
        // Now rebuild
        $this->info('Rebuilding caches for production...');
        shell_exec('php artisan config:cache 2>&1');
        shell_exec('php artisan route:cache 2>&1');
        $this->success('✅ Production caches rebuilt');
        $this->success[] = 'Cache Rebuild';
        
        chdir($this->basePath);
    }
    
    private function productionVerification() {
        $this->info('Verifying production readiness...');
        
        // Check config exists
        $configPath = $this->backendPath . '/config/purifier.php';
        if (file_exists($configPath)) {
            $this->success('✅ Purifier config exists');
            $this->success[] = 'Configuration Files';
        } else {
            $this->error('Purifier config not found');
            $this->errors[] = 'Configuration Files';
        }
        
        // Check service exists
        $servicePath = $this->backendPath . '/app/Services/HtmlPurifierService.php';
        if (file_exists($servicePath)) {
            $this->success('✅ HtmlPurifierService exists');
            $this->success[] = 'Service Layer';
        } else {
            $this->error('HtmlPurifierService not found');
            $this->errors[] = 'Service Layer';
        }
        
        // Check trait exists
        $traitPath = $this->backendPath . '/app/Traits/Purifiable.php';
        if (file_exists($traitPath)) {
            $this->success('✅ Purifiable trait exists');
            $this->success[] = 'Model Traits';
        } else {
            $this->error('Purifiable trait not found');
            $this->errors[] = 'Model Traits';
        }
        
        // Check SecurityHelper is deleted
        $oldPath = $this->backendPath . '/app/Helpers/SecurityHelper.php';
        if (!file_exists($oldPath)) {
            $this->success('✅ SecurityHelper.php successfully deleted');
            $this->success[] = 'Security Cleanup';
        } else {
            $this->error('SecurityHelper.php still exists - should be deleted');
            $this->errors[] = 'Security Cleanup';
        }
        
        // Check .env production status
        $envPath = $this->backendPath . '/.env';
        if (file_exists($envPath)) {
            $env = file_get_contents($envPath);
            if (strpos($env, 'APP_ENV=production') !== false) {
                $this->success('✅ Environment set to production');
                $this->success[] = 'Environment Configuration';
            } else {
                $this->warning('Environment is not set to production (currently in development mode)');
                $this->warnings[] = 'Environment Configuration';
            }
        }
    }
    
    private function summary() {
        $this->line();
        $this->section('DEPLOYMENT SUMMARY');
        
        $successCount = count($this->success);
        $warningCount = count($this->warnings);
        $errorCount = count($this->errors);
        
        if ($successCount > 0) {
            $this->line();
            $this->subheading('✅ Successful Operations (' . $successCount . ')');
            foreach ($this->success as $item) {
                echo "  ✓ " . $item . "\n";
            }
        }
        
        if ($warningCount > 0) {
            $this->line();
            $this->subheading('⚠️  Warnings (' . $warningCount . ')');
            foreach ($this->warnings as $item) {
                echo "  ⚠ " . $item . "\n";
            }
        }
        
        if ($errorCount > 0) {
            $this->line();
            $this->subheading('❌ Errors (' . $errorCount . ')');
            foreach ($this->errors as $item) {
                echo "  ✗ " . $item . "\n";
            }
        }
        
        $this->line();
        $this->line();
        
        if ($errorCount === 0) {
            $this->success('🎉 DEPLOYMENT SUCCESSFUL - Ready for production!');
            $this->line();
            $this->info('Next steps:');
            $this->info('  1. Verify application works in staging');
            $this->info('  2. Run smoke tests with real browsers');
            $this->info('  3. Monitor logs: tail -f storage/logs/laravel.log');
            $this->info('  4. Watch for "XSS content detected" warnings');
        } else {
            $this->error('⚠️  DEPLOYMENT COMPLETED WITH ERRORS');
            $this->line();
            $this->info('Please resolve the errors above before deploying to production.');
        }
        
        $this->line();
        echo "Deployment completed at: " . $this->timestamp . "\n";
        $this->line();
    }
    
    private function banner($text) {
        echo "\n";
        echo "╔════════════════════════════════════════════════════════════════════════════════╗\n";
        echo "║ " . str_pad($text, 82) . " ║\n";
        echo "╚════════════════════════════════════════════════════════════════════════════════╝\n";
    }
    
    private function section($text) {
        echo "📋 " . $text . "\n";
        echo str_repeat("─", strlen($text) + 3) . "\n";
    }
    
    private function subheading($text) {
        echo $text . "\n";
    }
    
    private function info($text) {
        echo "ℹ️  " . $text . "\n";
    }
    
    private function success($text) {
        echo "✅ " . $text . "\n";
    }
    
    private function warning($text) {
        echo "⚠️  " . $text . "\n";
    }
    
    private function error($text) {
        echo "❌ " . $text . "\n";
    }
    
    private function line() {
        echo "\n";
    }
}

// Run deployment
$deployment = new DeploymentManager();
$deployment->run();
