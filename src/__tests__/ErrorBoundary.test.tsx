import React from 'react';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../components/ErrorBoundary';

// Test component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean; message?: string }> = ({
  shouldThrow = false,
  message = 'Test error',
}) => {
  if (shouldThrow) {
    throw new Error(message);
  }
  return <div>No error</div>;
};

// Mock console.error to avoid noise in tests
const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

afterEach(() => {
  consoleSpy.mockClear();
});

afterAll(() => {
  consoleSpy.mockRestore();
});

describe('ErrorBoundary', () => {
  test('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Child component</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Child component')).toBeInTheDocument();
  });

  test('should render error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/we apologize for the inconvenience/i)).toBeInTheDocument();
  });

  test('should display error message', () => {
    const errorMessage = 'Custom error message';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} message={errorMessage} />
      </ErrorBoundary>
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  test('should have retry button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const retryButton = screen.getByRole('button', { name: /try again/i });
    expect(retryButton).toBeInTheDocument();
  });

  test('should reset error state when retry is clicked', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error boundary should be showing
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

    // Click retry button
    const retryButton = screen.getByRole('button', { name: /try again/i });
    retryButton.click();

    // Re-render with non-throwing component
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // Should show normal content
    expect(screen.getByText('No error')).toBeInTheDocument();
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
  });

  test('should have proper accessibility attributes', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const errorContainer = screen.getByRole('alert');
    expect(errorContainer).toBeInTheDocument();
    expect(errorContainer).toHaveAttribute('aria-live', 'assertive');
  });

  test('should log error to console', () => {
    const errorMessage = 'Test error for logging';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} message={errorMessage} />
      </ErrorBoundary>
    );

    expect(consoleSpy).toHaveBeenCalled();
  });

  test('should handle multiple error types', () => {
    const ReferenceErrorComponent = () => {
      throw new Error('Reference error test');
    };

    render(
      <ErrorBoundary>
        <ReferenceErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText('Reference error test')).toBeInTheDocument();
  });

  test('should handle async errors gracefully', async () => {
    const AsyncError = () => {
      React.useEffect(() => {
        // Simulate async error
        setTimeout(() => {
          throw new Error('Async error');
        }, 0);
      }, []);

      return <div>Async component</div>;
    };

    render(
      <ErrorBoundary>
        <AsyncError />
      </ErrorBoundary>
    );

    // Component should render initially
    expect(screen.getByText('Async component')).toBeInTheDocument();
  });

  test('should handle nested error boundaries', () => {
    const NestedError = () => {
      throw new Error('Nested error');
    };

    render(
      <ErrorBoundary>
        <div>
          <ErrorBoundary>
            <NestedError />
          </ErrorBoundary>
          <div>Sibling component</div>
        </div>
      </ErrorBoundary>
    );

    // Inner error boundary should catch the error
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    // Sibling component should still render
    expect(screen.getByText('Sibling component')).toBeInTheDocument();
  });

  test('should maintain error boundary isolation', () => {
    const FirstError = () => {
      throw new Error('First error');
    };

    const SecondComponent = () => <div>Second component works</div>;

    render(
      <div>
        <ErrorBoundary>
          <FirstError />
        </ErrorBoundary>
        <ErrorBoundary>
          <SecondComponent />
        </ErrorBoundary>
      </div>
    );

    // First boundary should show error
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    // Second boundary should show normal content
    expect(screen.getByText('Second component works')).toBeInTheDocument();
  });

  test('should have proper error message structure', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} message="Detailed error message" />
      </ErrorBoundary>
    );

    // Check for error title
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/something went wrong/i);

    // Check for error description
    expect(screen.getByText(/we apologize for the inconvenience/i)).toBeInTheDocument();

    // Check for error details
    expect(screen.getByText('Detailed error message')).toBeInTheDocument();

    // Check for action button
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  test('should handle error boundary with custom fallback', () => {
    const CustomErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
      return <ErrorBoundary>{children}</ErrorBoundary>;
    };

    render(
      <CustomErrorBoundary>
        <ThrowError shouldThrow={true} />
      </CustomErrorBoundary>
    );

    // Should show default error UI since fallback prop doesn't exist in current implementation
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  test('should handle component state after error', () => {
    const StatefulComponent = () => {
      const [count, setCount] = React.useState(0);
      const [shouldError, setShouldError] = React.useState(false);

      if (shouldError) {
        throw new Error('State error');
      }

      return (
        <div>
          <div>Count: {count}</div>
          <button onClick={() => setCount(count + 1)}>Increment</button>
          <button onClick={() => setShouldError(true)}>Trigger Error</button>
        </div>
      );
    };

    render(
      <ErrorBoundary>
        <StatefulComponent />
      </ErrorBoundary>
    );

    // Initially should show component
    expect(screen.getByText('Count: 0')).toBeInTheDocument();

    // Trigger error
    const errorButton = screen.getByRole('button', { name: /trigger error/i });
    errorButton.click();

    // Should show error boundary
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });
});
