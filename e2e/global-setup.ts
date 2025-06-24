import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for TMD Diagnostic App E2E tests...');

  // Launch browser for setup tasks
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for the application to be ready
    const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:5173';
    console.log(`📍 Testing application at: ${baseURL}`);

    await page.goto(baseURL);

    // Wait for the main content to load
    await page.waitForSelector('[data-testid="app"]', { timeout: 30000 });

    // Check if the application loads without errors
    const hasError = (await page.locator('.error-boundary').count()) > 0;
    if (hasError) {
      throw new Error('Application failed to load properly - error boundary detected');
    }

    // Prepare test data
    await setupTestData(page);

    // Clear any existing localStorage data
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    console.log('✅ Global setup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function setupTestData(page: any) {
  // Seed test data if needed
  await page.evaluate(() => {
    // Add any test data setup here
    const testAssessments = [
      {
        id: 'TEST001',
        result: {
          riskLevel: 'moderate',
          score: 75,
          recommendations: ['Test recommendation 1', 'Test recommendation 2'],
          timestamp: new Date().toISOString(),
          assessmentType: 'quick',
          answers: { description: 'Test pain description' },
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    localStorage.setItem('tmd_test_assessments', JSON.stringify(testAssessments));
  });
}

export default globalSetup;
