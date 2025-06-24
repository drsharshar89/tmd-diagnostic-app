# TMDAssessmentWizard Component

A comprehensive, medical-grade TMD (Temporomandibular Disorder) assessment wizard component with progressive disclosure, auto-save functionality, accessibility compliance, and mobile-first responsive design.

## Features

### 🏥 Medical-Grade Validation

- **DC/TMD Protocol Compliance**: Implements DC/TMD Protocol v2.1 standards
- **Evidence-Based Questions**: All questions based on clinical evidence levels A-D
- **Medical Validation**: Real-time validation against medical standards
- **Pain Scale Compliance**: Uses 0-4 pain intensity scale per DC/TMD protocol
- **ICD-10 Integration**: Supports medical coding standards

### 🔒 Security & Privacy

- **Auto-Save with Encryption**: Automatic saving with configurable encryption levels
- **HIPAA Compliance**: Secure handling of patient health information
- **Audit Trail**: Complete tracking of assessment actions
- **Data Integrity**: Validation and consistency checks

### ♿ Accessibility (WCAG 2.1 AA)

- **Screen Reader Support**: Full compatibility with assistive technologies
- **Keyboard Navigation**: Complete keyboard accessibility
- **High Contrast Mode**: Support for visual accessibility needs
- **Large Text Mode**: Configurable text scaling
- **Reduced Motion**: Respects user motion preferences
- **Focus Management**: Proper focus handling for navigation

### 📱 Responsive Design

- **Mobile-First**: Optimized for mobile devices
- **Progressive Enhancement**: Enhanced experience on larger screens
- **Touch-Friendly**: Large touch targets for mobile interaction
- **Flexible Layout**: Adapts to various screen sizes

## Usage

### Basic Usage

```tsx
import { TMDAssessmentWizard } from '@/shared/ui/organisms';
import type { AssessmentResponse, AssessmentSession } from '@/entities/assessment';

function AssessmentPage() {
  const handleComplete = (responses: AssessmentResponse[], session: AssessmentSession) => {
    console.log('Assessment completed:', { responses, session });
    // Process assessment results
  };

  const handleSave = (responses: AssessmentResponse[], isAutoSave: boolean) => {
    console.log('Assessment saved:', { responses, isAutoSave });
    // Save assessment data
  };

  const handleError = (error: Error, context: string) => {
    console.error('Assessment error:', { error, context });
    // Handle errors
  };

  return (
    <TMDAssessmentWizard
      onComplete={handleComplete}
      onSave={handleSave}
      onError={handleError}
      protocol="DC_TMD_AXIS_I"
      patientId="patient-123"
    />
  );
}
```

### Advanced Configuration

```tsx
import { TMDAssessmentWizard } from '@/shared/ui/organisms';

function AdvancedAssessmentPage() {
  const autoSaveConfig = {
    enabled: true,
    intervalMs: 30000, // 30 seconds
    encryptionLevel: 'enhanced' as const,
    retentionPeriod: 30, // days
  };

  const accessibilityConfig = {
    reducedMotion: false,
    highContrast: true,
    largeText: false,
    screenReader: true,
  };

  return (
    <TMDAssessmentWizard
      onComplete={handleComplete}
      onSave={handleSave}
      onError={handleError}
      protocol="DC_TMD_AXIS_II" // Includes psychosocial assessment
      patientId="patient-123"
      sessionId="session-456"
      autoSave={autoSaveConfig}
      theme="dark"
      accessibility={accessibilityConfig}
    />
  );
}
```

## API Reference

### Props

#### Required Props

| Prop         | Type                                                                    | Description                         |
| ------------ | ----------------------------------------------------------------------- | ----------------------------------- |
| `onComplete` | `(responses: AssessmentResponse[], session: AssessmentSession) => void` | Called when assessment is completed |

#### Optional Props

| Prop            | Type                                                             | Default           | Description                     |
| --------------- | ---------------------------------------------------------------- | ----------------- | ------------------------------- |
| `onSave`        | `(responses: AssessmentResponse[], isAutoSave: boolean) => void` | -                 | Called when assessment is saved |
| `onError`       | `(error: Error, context: string) => void`                        | -                 | Called when errors occur        |
| `protocol`      | `'DC_TMD_AXIS_I' \| 'DC_TMD_AXIS_II'`                            | `'DC_TMD_AXIS_I'` | Assessment protocol to use      |
| `patientId`     | `string`                                                         | -                 | Patient identifier              |
| `sessionId`     | `string`                                                         | -                 | Session identifier              |
| `autoSave`      | `AutoSaveConfig`                                                 | See below         | Auto-save configuration         |
| `theme`         | `'light' \| 'dark' \| 'high-contrast'`                           | `'light'`         | Visual theme                    |
| `locale`        | `string`                                                         | `'en'`            | Localization language           |
| `accessibility` | `AccessibilityConfig`                                            | See below         | Accessibility settings          |

### Type Definitions

#### AutoSaveConfig

```tsx
interface AutoSaveConfig {
  enabled: boolean;
  intervalMs: number; // Auto-save interval in milliseconds
  encryptionLevel: 'standard' | 'enhanced' | 'maximum';
  retentionPeriod: number; // Retention period in days
}
```

#### AccessibilityConfig

```tsx
interface AccessibilityConfig {
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  screenReader: boolean;
}
```

#### ValidationError

```tsx
interface ValidationError {
  questionId: string;
  errorType: 'required' | 'format' | 'range' | 'consistency' | 'medical';
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestedAction?: string;
  medicalReference?: string;
}
```

## Medical Standards Compliance

### DC/TMD Protocol Implementation

The component implements the Diagnostic Criteria for Temporomandibular Disorders (DC/TMD) Protocol:

- **Version**: 2.1
- **Pain Scale**: 0-4 intensity scale (not 0-10)
- **Axis I**: Physical findings and diagnoses
- **Axis II**: Psychosocial factors (when protocol includes it)

### Evidence Levels

Questions are categorized by clinical evidence levels:

- **Level A**: Strong evidence from multiple high-quality studies
- **Level B**: Moderate evidence from well-designed studies
- **Level C**: Limited evidence from case studies
- **Level D**: Expert opinion or theoretical considerations

### Medical Validation Rules

1. **Pain Intensity**: Must be 0-4 scale per DC/TMD standard
2. **Required Questions**: Critical diagnostic questions must be answered
3. **Response Consistency**: Validates logical consistency between answers
4. **Clinical Relevance**: Ensures medically meaningful responses

## Accessibility Features

### Keyboard Navigation

- **Arrow Keys**: Navigate between steps (Ctrl/Cmd + Arrow)
- **Tab/Shift+Tab**: Navigate between form elements
- **Enter/Space**: Activate buttons and select options
- **Escape**: Cancel current action
- **Ctrl/Cmd+S**: Manual save

### Screen Reader Support

- **ARIA Labels**: Comprehensive labeling for all interactive elements
- **Live Regions**: Dynamic content announcements
- **Semantic HTML**: Proper heading structure and landmarks
- **Progress Updates**: Spoken progress indicators

### Visual Accessibility

- **High Contrast Mode**: Enhanced color contrast for visibility
- **Large Text Mode**: Scalable text for readability
- **Focus Indicators**: Clear visual focus indicators
- **Color Independence**: Information not conveyed by color alone

## Styling and Theming

### CSS Classes

The component uses CSS modules with the following main classes:

- `.assessmentWizard`: Main container
- `.progressIndicator`: Progress bar and indicators
- `.stepContainer`: Step content container
- `.questionBlock`: Individual question containers
- `.navigationControls`: Navigation buttons

### Theme Variables

```css
/* Light Theme (default) */
--bg-primary: #ffffff;
--text-primary: #212529;
--accent-color: #0d6efd;
--error-color: #dc3545;
--success-color: #198754;

/* Dark Theme */
--bg-primary: #1a1a1a;
--text-primary: #ffffff;
--accent-color: #4dabf7;
--error-color: #ff6b6b;
--success-color: #51cf66;
```

### Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1023px
- **Desktop**: ≥ 1024px

## Performance Considerations

### Optimization Features

- **React.memo**: Memoized components for performance
- **useCallback**: Stable function references
- **useMemo**: Memoized computations
- **Debounced Auto-save**: Prevents excessive save operations
- **Lazy Loading**: Progressive loading of assessment steps

### Bundle Size

- **Component Size**: ~29KB (TypeScript)
- **CSS Size**: ~14KB
- **Dependencies**: Minimal external dependencies
- **Tree Shaking**: Optimized for bundle splitting

## Testing

### Test Coverage

- **Unit Tests**: Component logic and validation
- **Integration Tests**: User interaction flows
- **Accessibility Tests**: Screen reader and keyboard navigation
- **Medical Validation Tests**: Clinical rule compliance

### Test Example

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TMDAssessmentWizard } from '@/shared/ui/organisms';

test('should validate pain intensity scale', async () => {
  const user = userEvent.setup();
  const onComplete = jest.fn();

  render(<TMDAssessmentWizard onComplete={onComplete} />);

  // Navigate to pain intensity question
  const yesButton = screen.getByRole('button', { name: 'Yes' });
  await user.click(yesButton);

  // Test scale validation
  const scaleButton = screen.getByRole('button', { name: 'Rating: 2' });
  await user.click(scaleButton);

  expect(scaleButton).toHaveAttribute('aria-pressed', 'true');
});
```

## Browser Support

### Supported Browsers

- **Chrome**: 88+
- **Firefox**: 85+
- **Safari**: 14+
- **Edge**: 88+

### Polyfills Required

- None (uses modern web APIs with fallbacks)

## Security Considerations

### Data Protection

- **Encryption**: Configurable encryption for sensitive data
- **HIPAA Compliance**: Secure handling of PHI
- **Audit Logging**: Complete action tracking
- **Input Sanitization**: XSS prevention

### Privacy Features

- **Data Retention**: Configurable retention periods
- **Access Controls**: Role-based access restrictions
- **Anonymization**: Optional data anonymization
- **Consent Management**: User consent tracking

## Migration Guide

### From Existing Assessment Components

If migrating from existing assessment components:

1. **Update Imports**: Change to new component path
2. **Update Props**: Map existing props to new interface
3. **Handle Events**: Update event handlers for new signature
4. **Test Thoroughly**: Validate medical accuracy

### Breaking Changes

- **Pain Scale**: Changed from 0-10 to 0-4 scale
- **Event Signatures**: Updated callback parameters
- **CSS Classes**: New CSS module structure
- **Dependencies**: Updated peer dependencies

## Contributing

### Development Setup

1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Run tests: `npm test`
4. Build for production: `npm run build`

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Medical-grade linting rules
- **Prettier**: Consistent code formatting
- **Testing**: 100% coverage for medical logic

### Medical Review Process

All medical-related changes require:

1. **Clinical Review**: Medical professional approval
2. **Evidence Validation**: Citation of clinical sources
3. **Compliance Check**: DC/TMD protocol verification
4. **Test Coverage**: Comprehensive medical validation tests

## Support

For technical support or medical validation questions:

- **Documentation**: Check this README and inline comments
- **Issues**: Create GitHub issues for bugs
- **Medical Questions**: Consult with clinical team
- **Accessibility**: Contact accessibility team for WCAG compliance

## License

This component is part of the TMD Diagnostic Application and is subject to medical device regulations and HIPAA compliance requirements.
