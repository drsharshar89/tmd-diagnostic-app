import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for TMD Diagnostic App E2E tests...');

  try {
    // Generate test summary
    await generateTestSummary();

    // Clean up test artifacts if needed
    await cleanupTestData();

    console.log('✅ Global teardown completed successfully');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw to avoid masking test failures
  }
}

async function generateTestSummary() {
  const resultsPath = path.join(process.cwd(), 'test-results', 'results.json');

  if (fs.existsSync(resultsPath)) {
    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

    const summary = {
      totalTests: results.stats?.total || 0,
      passed: results.stats?.passed || 0,
      failed: results.stats?.failed || 0,
      skipped: results.stats?.skipped || 0,
      duration: results.stats?.duration || 0,
      timestamp: new Date().toISOString(),
    };

    const summaryPath = path.join(process.cwd(), 'test-results', 'summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    console.log('📊 Test Summary:');
    console.log(`   Total: ${summary.totalTests}`);
    console.log(`   Passed: ${summary.passed}`);
    console.log(`   Failed: ${summary.failed}`);
    console.log(`   Skipped: ${summary.skipped}`);
    console.log(`   Duration: ${(summary.duration / 1000).toFixed(2)}s`);
  }
}

async function cleanupTestData() {
  // Clean up any test files or data created during tests
  const tempPaths = [path.join(process.cwd(), 'tmp'), path.join(process.cwd(), 'test-downloads')];

  for (const tempPath of tempPaths) {
    if (fs.existsSync(tempPath)) {
      fs.rmSync(tempPath, { recursive: true, force: true });
      console.log(`🗑️  Cleaned up: ${tempPath}`);
    }
  }
}

export default globalTeardown;
