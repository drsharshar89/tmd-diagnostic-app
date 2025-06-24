# Medical Protocol Engine - Architecture Documentation

## Overview

The Medical Protocol Engine is a centralized, clinical-grade diagnostic system that consolidates all TMD (Temporomandibular Disorder) assessment logic into a single, testable, and modular framework. It replaces scattered diagnostic logic across multiple files with a unified, evidence-based approach following DC/TMD (Diagnostic Criteria for Temporomandibular Disorders) v2.1 protocols.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Medical Protocol Engine                      │
│                        (Singleton)                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Public API    │  │ Configuration   │  │ Error Handling  │ │
│  │                 │  │                 │  │                 │ │
│  │ • processComp() │  │ • Protocol Ver  │  │ • Validation    │ │
│  │ • processQuick()│  │ • Algorithm Ver │  │ • Error Logging │ │
│  │ • Factory Funcs │  │ • Confidence    │  │ • Exception Mgmt│ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                    Core Scoring Engine                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Pain Assessment │  │ Function Assess │  │ Joint Sounds    │ │
│  │                 │  │                 │  │                 │ │
│  │ • Q1-Q7 Logic   │  │ • Q12-Q17 Logic │  │ • Q8-Q11 Logic  │ │
│  │ • DC/TMD Scale  │  │ • Functional    │  │ • Sound Analysis│ │
│  │ • Weight: 35%   │  │ • Weight: 30%   │  │ • Weight: 15%   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐                     │
│  │ Associated Symp │  │ History/Triggers│                     │
│  │                 │  │                 │                     │
│  │ • Q18-Q21 Logic │  │ • Q22-Q26 Logic │                     │
│  │ • Symptom Map   │  │ • Risk Factors  │                     │
│  │ • Weight: 10%   │  │ • Weight: 10%   │                     │
│  └─────────────────┘  └─────────────────┘                     │
├─────────────────────────────────────────────────────────────────┤
│                    Risk Stratification                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Risk Calculation│  │ Clinical Flags  │  │ Confidence Calc │ │
│  │                 │  │                 │  │                 │ │
│  │ • Weighted Sum  │  │ • Red Flags     │  │ • Completeness  │ │
│  │ • Thresholds    │  │ • Urgent Care   │  │ • Consistency   │ │
│  │ • Low/Mod/High  │  │ • Specialist    │  │ • Quality Score │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                Medical Classification                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ TMD Classification│ │ ICD-10 Mapping │  │ Recommendations │ │
│  │                 │  │                 │  │                 │ │
│  │ • DC/TMD Criteria│ │ • M26.62 Codes │  │ • Risk-Based    │ │
│  │ • Axis I/II     │  │ • Primary/Sec   │  │ • Category-Spec │ │
│  │ • Severity      │  │ • Confidence    │  │ • Evidence-Based│ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      Data Flow                                  │
└─────────────────────────────────────────────────────────────────┘

Input (Answers) → Validation → Category Scoring → Weighted Calculation
                                     ↓
Quality Metrics ← Risk Determination ← Clinical Flags Assessment
                                     ↓
Medical Classification → ICD-10 Mapping → Recommendations → Result
```

## Design Patterns

### 1. Singleton Pattern

- **Purpose**: Ensures consistent diagnostic logic across the application
- **Implementation**: Static instance with lazy initialization
- **Benefits**: Prevents multiple versions of diagnostic algorithms

### 2. Factory Pattern

- **Purpose**: Provides convenient creation and access methods
- **Functions**: `createMedicalProtocolEngine()`, `processComprehensiveAssessment()`, `processQuickAssessment()`
- **Benefits**: Simplifies usage and maintains consistency

### 3. Strategy Pattern (Implicit)

- **Purpose**: Different assessment strategies for comprehensive vs. quick assessments
- **Implementation**: Method overloading with different algorithms
- **Benefits**: Flexible assessment types while maintaining core logic

## Core Components

### 1. Medical Constants (DC_TMD_CONSTANTS)

```typescript
export const DC_TMD_CONSTANTS = {
  PAIN_SCALE: {
    MIN: 0,
    MAX: 4,
    THRESHOLD_MILD: 1,
    THRESHOLD_MODERATE: 2,
    THRESHOLD_SEVERE: 3,
  },
  RISK_THRESHOLDS: {
    LOW_MAX: 30,
    MODERATE_MIN: 31,
    MODERATE_MAX: 65,
    HIGH_MIN: 66,
    HIGH_MAX: 100,
  },
  CATEGORY_WEIGHTS: {
    PAIN: 0.35, // Primary diagnostic criterion
    FUNCTION: 0.3, // Functional impact assessment
    JOINT_SOUNDS: 0.15, // Structural indicators
    ASSOCIATED: 0.1, // Associated symptoms
    HISTORY: 0.1, // Risk factors & triggers
  },
};
```

### 2. Scoring Categories

#### Pain Assessment (35% Weight)

- **Questions**: Q1-Q7
- **Logic**: Boolean pain indicators + normalized pain intensity
- **DC/TMD Compliance**: 0-10 scale normalized to 0-4 per protocol
- **Clinical Significance**: Primary diagnostic criterion

#### Functional Assessment (30% Weight)

- **Questions**: Q12-Q17
- **Logic**: Functional limitations and jaw mechanics
- **Higher Weight**: Functional impairment heavily weighted per DC/TMD
- **Red Flags**: Jaw locking (Q17) triggers immediate attention

#### Joint Sounds Assessment (15% Weight)

- **Questions**: Q8-Q11
- **Logic**: Sound types + bilateral/unilateral classification
- **Structural Indicators**: Clicking, grating, popping patterns
- **Location Mapping**: Bilateral sounds score higher than unilateral

#### Associated Symptoms (10% Weight)

- **Questions**: Q18-Q21
- **Logic**: Headaches, neck pain, tooth pain, ear symptoms
- **Regional Assessment**: Indicates TMD impact beyond jaw

#### History & Triggers (10% Weight)

- **Questions**: Q22-Q26
- **Logic**: Trauma, dental work, stress, bruxism patterns
- **Risk Factors**: Recent events weighted higher
- **Stress Integration**: Psychosocial factors per DC/TMD Axis II

### 3. Risk Stratification Algorithm

```typescript
function determineRiskLevel(normalizedScore: number): RiskLevel {
  if (normalizedScore <= 30) return 'low';
  if (normalizedScore <= 65) return 'moderate';
  return 'high';
}
```

### 4. Clinical Decision Support

#### Red Flags (Immediate Attention)

- Pain ≥8/10
- Jaw locking episodes
- Recent trauma + high symptom load

#### Follow-up Triggers

- Risk score >30%
- High stress levels (≥8/10)
- Multiple functional limitations

#### Specialist Referral

- Risk score >65%
- Complex symptom patterns
- Treatment-resistant cases

## Pure Functions for Testability

All core diagnostic logic is implemented as pure functions:

```typescript
// Example: Pain scoring is deterministic and testable
private calculatePainScore(answers: ComprehensiveAnswers): CategoryScore {
  // Pure function - same input always produces same output
  // No side effects, no external dependencies
  // Fully testable in isolation
}
```

## Quality Assurance

### 1. Confidence Calculation

- **Data Completeness**: Percentage of questions answered
- **Response Consistency**: Logical coherence validation
- **Clinical Reliability**: Combined quality metric

### 2. Validation Layers

- **Input Validation**: Type checking, range validation
- **Medical Validation**: DC/TMD protocol compliance
- **Output Validation**: Result structure and completeness

### 3. Error Handling

- **Graceful Degradation**: Partial assessments when possible
- **Error Logging**: Comprehensive error tracking
- **User Feedback**: Clear error messages for correctable issues

## Integration Points

### 1. Existing Codebase Integration

- **Replaces**: `TMDDiagnosticEngine.ts`, `enhanced-calculations.ts`, scattered logic
- **Maintains**: Same public interface for backward compatibility
- **Enhances**: Adds medical-grade validation and classification

### 2. HIPAA Security Integration

- **Secure Processing**: No PHI storage in engine
- **Audit Trail**: All assessments logged through HIPAASecurityService
- **Data Classification**: Automatic PHI classification for results

### 3. Type System Integration

- **Existing Types**: Uses current `ComprehensiveAnswers`, `QuickAssessmentAnswers`
- **Enhanced Results**: Extends `AssessmentResult` with medical classification
- **Type Safety**: Full TypeScript coverage with strict validation

## Performance Characteristics

### 1. Processing Time

- **Comprehensive Assessment**: <100ms target
- **Quick Assessment**: <50ms target
- **Concurrent Processing**: Thread-safe singleton

### 2. Memory Usage

- **Singleton Instance**: Single instance per application
- **Stateless Processing**: No state retention between assessments
- **Efficient Algorithms**: O(1) complexity for most operations

### 3. Scalability

- **Horizontal Scaling**: Stateless design supports clustering
- **Load Balancing**: No session affinity required
- **Caching**: Constants cached at initialization

## Testing Strategy

### 1. Unit Tests (Comprehensive)

- **Patient Scenarios**: 5 realistic patient profiles
- **Edge Cases**: Boundary conditions, invalid inputs
- **Pure Functions**: All scoring functions tested in isolation
- **Performance**: Processing time validation

### 2. Integration Tests

- **End-to-End**: Full assessment workflows
- **Error Scenarios**: Exception handling validation
- **Configuration**: Different protocol configurations

### 3. Medical Validation Tests

- **DC/TMD Compliance**: Protocol adherence verification
- **Clinical Accuracy**: Evidence-based recommendation validation
- **ICD-10 Mapping**: Proper diagnostic code assignment

## Future Extensibility

### 1. Protocol Updates

- **Version Management**: Algorithm and protocol versioning
- **Backward Compatibility**: Legacy assessment support
- **Configuration Driven**: Easy protocol parameter updates

### 2. Additional Assessment Types

- **Pediatric TMD**: Age-specific algorithms
- **Post-Treatment**: Treatment outcome assessments
- **Screening Tools**: Population-level screening

### 3. Advanced Analytics

- **Machine Learning**: Pattern recognition enhancement
- **Predictive Modeling**: Treatment outcome prediction
- **Population Health**: Aggregate risk analysis

## Security Considerations

### 1. Data Protection

- **No PHI Storage**: Engine processes but doesn't store patient data
- **Secure Processing**: In-memory processing only
- **Audit Integration**: All processing logged securely

### 2. Algorithm Protection

- **Intellectual Property**: Proprietary diagnostic algorithms
- **Version Control**: Algorithm integrity verification
- **Access Control**: Restricted engine configuration

### 3. Compliance

- **HIPAA Compliant**: No PHI retention or exposure
- **FDA Considerations**: Medical device software guidelines
- **Clinical Validation**: Evidence-based algorithm development

## Deployment Architecture

### 1. Development Environment

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Local Dev     │    │   Test Engine   │    │   Mock Data     │
│                 │    │                 │    │                 │
│ • Hot Reload    │───▶│ • Unit Tests    │───▶│ • Patient Sims  │
│ • Debug Mode    │    │ • Integration   │    │ • Edge Cases    │
│ • Fast Feedback │    │ • Performance   │    │ • Validation    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 2. Production Environment

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Load Balancer  │    │ Application Srv │    │ Medical Engine  │
│                 │    │                 │    │                 │
│ • SSL Term      │───▶│ • Engine Host   │───▶│ • Singleton     │
│ • Health Check  │    │ • HIPAA Secure  │    │ • Pure Functions│
│ • Failover      │    │ • Audit Logging │    │ • Medical Logic │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Monitoring and Observability

### 1. Performance Metrics

- **Processing Time**: Assessment duration tracking
- **Throughput**: Assessments per second
- **Error Rates**: Failed assessment percentage
- **Resource Usage**: Memory and CPU utilization

### 2. Medical Metrics

- **Risk Distribution**: Low/moderate/high risk percentages
- **Confidence Scores**: Assessment reliability tracking
- **Clinical Flags**: Red flag occurrence rates
- **Recommendation Patterns**: Treatment recommendation analysis

### 3. Quality Metrics

- **Data Completeness**: Question response rates
- **Consistency Scores**: Response coherence tracking
- **Validation Failures**: Input validation error rates
- **Algorithm Performance**: Diagnostic accuracy metrics

This architecture provides a robust, scalable, and medically-compliant foundation for TMD diagnostic assessment while maintaining the flexibility to evolve with advancing medical knowledge and regulatory requirements.
