import { test, expect } from '@playwright/test';

test.describe('TMD Assessment Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the application to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Quick Assessment Flow', () => {
    test('should complete quick assessment with valid input', async ({ page }) => {
      // Navigate to quick assessment
      await page.click('[data-testid="quick-assessment-button"]');
      await expect(page).toHaveURL('/quick-assessment');

      // Check page elements
      await expect(page.locator('h2')).toContainText('Quick Assessment');
      await expect(page.locator('textarea')).toBeVisible();

      // Fill in the assessment
      const testDescription =
        'I have been experiencing severe jaw pain for the past week. The pain is constant and gets worse when I try to chew. I also hear clicking sounds when I open my mouth.';
      await page.fill('textarea', testDescription);

      // Verify next button is enabled
      const nextButton = page.locator('[data-testid="next-button"]');
      await expect(nextButton).toBeEnabled();

      // Submit the assessment
      await nextButton.click();

      // Verify navigation to results
      await expect(page).toHaveURL('/results');
      await page.waitForLoadState('networkidle');

      // Verify results page content
      await expect(page.locator('h2')).toContainText('Assessment Results');
      await expect(page.locator('[data-testid="risk-level"]')).toBeVisible();
      await expect(page.locator('[data-testid="recommendations"]')).toBeVisible();

      // Verify risk level is calculated (should be high for this input)
      const riskLevel = await page.locator('[data-testid="risk-level"]').textContent();
      expect(riskLevel).toContain('High');
    });

    test('should not allow submission with empty input', async ({ page }) => {
      await page.click('[data-testid="quick-assessment-button"]');

      const nextButton = page.locator('[data-testid="next-button"]');
      await expect(nextButton).toBeDisabled();

      // Try typing and deleting
      await page.fill('textarea', 'test');
      await expect(nextButton).toBeEnabled();

      await page.fill('textarea', '');
      await expect(nextButton).toBeDisabled();
    });

    test('should handle whitespace-only input', async ({ page }) => {
      await page.click('[data-testid="quick-assessment-button"]');

      await page.fill('textarea', '   \n\t   ');
      const nextButton = page.locator('[data-testid="next-button"]');
      await expect(nextButton).toBeDisabled();
    });

    test('should navigate back to home', async ({ page }) => {
      await page.click('[data-testid="quick-assessment-button"]');

      await page.click('[data-testid="back-button"]');
      await expect(page).toHaveURL('/');
    });

    test('should show progress indicator', async ({ page }) => {
      await page.click('[data-testid="quick-assessment-button"]');

      await expect(page.locator('[data-testid="progress-indicator"]')).toContainText('1 / 1');

      const progressBar = page.locator('.progress-fill');
      await expect(progressBar).toHaveCSS('width', /100%/);
    });
  });

  test.describe('Comprehensive Assessment Flow', () => {
    test('should complete comprehensive assessment', async ({ page }) => {
      // Navigate to comprehensive assessment
      await page.click('[data-testid="comprehensive-assessment-button"]');
      await expect(page).toHaveURL('/comprehensive-assessment');

      // Answer first question
      await page.check('[data-testid="q1-yes"]');

      // Navigate to next question
      await page.click('[data-testid="next-button"]');

      // Answer second question
      await page.check('[data-testid="q2-no"]');
      await page.click('[data-testid="next-button"]');

      // Answer third question
      await page.check('[data-testid="q3-yes"]');
      await page.click('[data-testid="next-button"]');

      // Verify navigation to results
      await expect(page).toHaveURL('/results');

      // Verify results page shows comprehensive results
      await expect(page.locator('[data-testid="assessment-type"]')).toContainText('Comprehensive');
      await expect(page.locator('[data-testid="risk-level"]')).toBeVisible();
    });

    test('should require answers before proceeding', async ({ page }) => {
      await page.click('[data-testid="comprehensive-assessment-button"]');

      const nextButton = page.locator('[data-testid="next-button"]');
      await expect(nextButton).toBeDisabled();

      // Select an answer
      await page.check('[data-testid="q1-yes"]');
      await expect(nextButton).toBeEnabled();
    });

    test('should allow changing answers', async ({ page }) => {
      await page.click('[data-testid="comprehensive-assessment-button"]');

      // Select yes first
      await page.check('[data-testid="q1-yes"]');
      await expect(page.locator('[data-testid="q1-yes"]')).toBeChecked();

      // Change to no
      await page.check('[data-testid="q1-no"]');
      await expect(page.locator('[data-testid="q1-no"]')).toBeChecked();
      await expect(page.locator('[data-testid="q1-yes"]')).not.toBeChecked();
    });

    test('should show question progress', async ({ page }) => {
      await page.click('[data-testid="comprehensive-assessment-button"]');

      // Check initial progress
      await expect(page.locator('[data-testid="progress-indicator"]')).toContainText('1 / 3');

      // Answer and proceed
      await page.check('[data-testid="q1-yes"]');
      await page.click('[data-testid="next-button"]');

      // Check updated progress
      await expect(page.locator('[data-testid="progress-indicator"]')).toContainText('2 / 3');
    });
  });

  test.describe('Results Page', () => {
    test('should display all result components', async ({ page }) => {
      // Complete quick assessment first
      await page.click('[data-testid="quick-assessment-button"]');
      await page.fill('textarea', 'Moderate jaw pain and clicking');
      await page.click('[data-testid="next-button"]');

      // Verify all result components are present
      await expect(page.locator('[data-testid="risk-level"]')).toBeVisible();
      await expect(page.locator('[data-testid="recommendations"]')).toBeVisible();
      await expect(page.locator('[data-testid="timestamp"]')).toBeVisible();
      await expect(page.locator('[data-testid="assessment-code"]')).toBeVisible();
    });

    test('should generate shareable assessment code', async ({ page }) => {
      await page.click('[data-testid="quick-assessment-button"]');
      await page.fill('textarea', 'Test symptoms');
      await page.click('[data-testid="next-button"]');

      const assessmentCode = page.locator('[data-testid="assessment-code"]');
      await expect(assessmentCode).toBeVisible();

      // Code should be 6 characters
      const codeText = await assessmentCode.textContent();
      expect(codeText).toMatch(/[A-Z0-9]{6}/);
    });

    test('should allow starting new assessment', async ({ page }) => {
      await page.click('[data-testid="quick-assessment-button"]');
      await page.fill('textarea', 'Test symptoms');
      await page.click('[data-testid="next-button"]');

      await page.click('[data-testid="new-assessment-button"]');
      await expect(page).toHaveURL('/');
    });

    test('should display appropriate recommendations based on risk level', async ({ page }) => {
      // Test high risk scenario
      await page.click('[data-testid="quick-assessment-button"]');
      await page.fill(
        'textarea',
        'Severe excruciating pain, jaw is locked and I cannot open my mouth at all. The pain is unbearable and constant.'
      );
      await page.click('[data-testid="next-button"]');

      await expect(page.locator('[data-testid="risk-level"]')).toContainText('High');
      await expect(page.locator('[data-testid="recommendations"]')).toContainText('immediately');
    });
  });

  test.describe('Language Support', () => {
    test('should work in Russian', async ({ page }) => {
      // Switch to Russian
      await page.click('[data-testid="language-toggle"]');
      await page.click('[data-testid="lang-ru"]');

      // Navigate to assessment
      await page.click('[data-testid="quick-assessment-button"]');

      // Check Russian text is displayed
      await expect(page.locator('h2')).toContainText('Быстрая оценка');
    });

    test('should work in Chinese', async ({ page }) => {
      // Switch to Chinese
      await page.click('[data-testid="language-toggle"]');
      await page.click('[data-testid="lang-zh"]');

      await page.click('[data-testid="quick-assessment-button"]');

      // Check Chinese text is displayed
      await expect(page.locator('h2')).toContainText('快速评估');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle browser refresh during assessment', async ({ page }) => {
      await page.click('[data-testid="quick-assessment-button"]');
      await page.fill('textarea', 'Test input');

      // Refresh the page
      await page.reload();

      // Should be back on assessment page with empty form
      await expect(page).toHaveURL('/quick-assessment');
      await expect(page.locator('textarea')).toHaveValue('');
    });

    test('should handle navigation errors gracefully', async ({ page }) => {
      // Try to navigate to non-existent route
      await page.goto('/non-existent-route');

      // Should redirect to home or show 404
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      // Tab through the home page
      await page.keyboard.press('Tab'); // Quick assessment button
      await page.keyboard.press('Tab'); // Comprehensive assessment button
      await page.keyboard.press('Tab'); // Language toggle

      // Activate quick assessment with Enter
      await page.keyboard.press('Shift+Tab'); // Back to comprehensive
      await page.keyboard.press('Shift+Tab'); // Back to quick
      await page.keyboard.press('Enter');

      await expect(page).toHaveURL('/quick-assessment');
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.click('[data-testid="quick-assessment-button"]');

      // Check textarea has accessible name
      const textarea = page.locator('textarea');
      await expect(textarea).toHaveAttribute('aria-label');
    });

    test('should support screen readers', async ({ page }) => {
      await page.click('[data-testid="quick-assessment-button"]');

      // Check for semantic HTML
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('h1, h2')).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should load quickly', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      // Should load in under 2 seconds
      expect(loadTime).toBeLessThan(2000);
    });

    test('should handle large text input efficiently', async ({ page }) => {
      await page.click('[data-testid="quick-assessment-button"]');

      // Generate large text input
      const largeText = 'a'.repeat(1000);

      const startTime = Date.now();
      await page.fill('textarea', largeText);
      const inputTime = Date.now() - startTime;

      // Should handle large input quickly
      expect(inputTime).toBeLessThan(1000);

      await expect(page.locator('textarea')).toHaveValue(largeText);
    });
  });
});
