# 🚨 TMD App - Critical Implementation Guide

## 🔴 PRIORITY 1: Fix Breaking Issues (Day 1-2)

### 1. Fix Test Import Issues

**File: `src/shared/ui/organisms/__tests__/TMDAssessmentWizard.test.tsx`**
```typescript
// Remove this line:
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Replace with:
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Replace all vi.* with jest.*
// vi.fn() → jest.fn()
// vi.spyOn() → jest.spyOn()
// vi.mocked() → jest.mocked()
```

### 2. Install Missing Critical Dependencies
```bash
# Core missing dependencies
npm install react-i18next i18next i18next-browser-languagedetector
npm install zod @hookform/resolvers
npm install @react-three/fiber @react-three/drei
npm install jspdf html2canvas  # For report generation
npm install date-fns  # For date handling

# Development dependencies
npm install --save-dev @types/three
```

### 3. Create Proper i18n Configuration

**File: `src/config/i18n.config.ts`**
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from '@/locales/en/common.json';
import esTranslations from '@/locales/es/common.json';
import zhTranslations from '@/locales/zh/common.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      es: { translation: esTranslations },
      zh: { translation: zhTranslations }
    },
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
```

## 🟡 PRIORITY 2: Core Missing Features (Day 3-5)

### 1. Implement 3D Pain Mapping

**File: `src/features/pain-mapping/components/TMDPainMapper.tsx`**
```typescript
import React, { FC, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

interface PainPoint {
  id: string;
  position: THREE.Vector3;
  intensity: number; // 0-4 scale
  bilateral: boolean;
  anatomicalName: string;
}

export const TMDPainMapper: FC = () => {
  const [painPoints, setPainPoints] = useState<PainPoint[]>([]);
  
  const handlePointClick = (position: THREE.Vector3, anatomicalName: string) => {
    // Add pain point logic
  };
  
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <OrbitControls enablePan={false} />
      
      {/* 3D Head Model */}
      <HeadModel onPointClick={handlePointClick} />
      
      {/* Pain Points */}
      {painPoints.map(point => (
        <PainPointMarker key={point.id} point={point} />
      ))}
    </Canvas>
  );
};
```

### 2. Implement Report Generation

**File: `src/features/reports/TMDReportGenerator.ts`**
```typescript
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';

export class TMDReportGenerator {
  async generatePDF(assessment: AssessmentResult): Promise<Blob> {
    const pdf = new jsPDF();
    
    // Add header
    pdf.setFontSize(20);
    pdf.text('TMD Assessment Report', 20, 20);
    
    // Add patient info (anonymized)
    pdf.setFontSize(12);
    pdf.text(`Date: ${format(new Date(), 'PPP')}`, 20, 40);
    pdf.text(`Assessment ID: ${assessment.id}`, 20, 50);
    
    // Add risk assessment
    pdf.text(`Risk Level: ${assessment.riskLevel}`, 20, 70);
    pdf.text(`Confidence: ${assessment.confidence}%`, 20, 80);
    
    // Add recommendations
    pdf.text('Recommendations:', 20, 100);
    assessment.recommendations.forEach((rec, index) => {
      pdf.text(`${index + 1}. ${rec}`, 30, 110 + (index * 10));
    });
    
    return pdf.output('blob');
  }
}
```

### 3. Create Missing Hooks

**File: `src/shared/hooks/useLazyLoading.ts`**
```typescript
import { useEffect, useRef, useState } from 'react';

export function useLazyLoading<T extends HTMLElement = HTMLDivElement>(
  options: IntersectionObserverInit = {}
) {
  const ref = useRef<T>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsIntersecting(true);
        setHasLoaded(true);
      }
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [options]);

  return { ref, isIntersecting, hasLoaded };
}
```

**File: `src/shared/hooks/useVirtualScroll.ts`**
```typescript
import { useState, useCallback, useMemo } from 'react';

interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  buffer?: number;
}

export function useVirtualScroll<T>(
  items: T[],
  options: VirtualScrollOptions
) {
  const [scrollTop, setScrollTop] = useState(0);
  const { itemHeight, containerHeight, buffer = 5 } = options;

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
    const endIndex = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + buffer
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, buffer, items.length]);

  const visibleItems = items.slice(visibleRange.startIndex, visibleRange.endIndex);

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    onScroll,
    totalHeight: items.length * itemHeight,
    offsetY: visibleRange.startIndex * itemHeight
  };
}
```

## 🟢 PRIORITY 3: Integration Features (Day 6-10)

### 1. Create Locales Structure
```bash
mkdir -p src/locales/{en,es,zh,ru,fr,de,ja,ar}
```

**File: `src/locales/en/common.json`**
```json
{
  "app": {
    "title": "TMD Diagnostic Tool",
    "subtitle": "Professional Assessment System"
  },
  "assessment": {
    "quick": {
      "title": "Quick Assessment",
      "duration": "1 minute",
      "description": "Brief screening for TMD symptoms"
    },
    "comprehensive": {
      "title": "Comprehensive Assessment",
      "duration": "15-20 minutes",
      "description": "Full DC/TMD protocol evaluation"
    }
  },
  "pain": {
    "scale": {
      "0": "No pain",
      "1": "Mild pain",
      "2": "Moderate pain",
      "3": "Severe pain",
      "4": "Very severe pain"
    }
  },
  "errors": {
    "required": "This field is required",
    "invalidRange": "Value must be between {{min}} and {{max}}",
    "networkError": "Network error. Please try again."
  }
}
```

### 2. Implement Data Validation Layer

**File: `src/shared/validators/assessmentValidators.ts`**
```typescript
import { z } from 'zod';

// DC/TMD compliant pain scale (0-4)
export const painScaleSchema = z.number().min(0).max(4);

// Quick assessment schema
export const quickAssessmentSchema = z.object({
  description: z.string().min(10).max(500),
  timestamp: z.date()
});

// Comprehensive assessment schema
export const comprehensiveAssessmentSchema = z.object({
  painAtRest: z.boolean(),
  painDuringFunction: z.boolean(),
  painIntensity: painScaleSchema,
  jointSounds: z.boolean(),
  functionLimitation: z.boolean(),
  // ... add all fields
});

// Medical validation helper
export function validateMedicalData<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): { success: boolean; data?: T; errors?: string[] } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(e => e.message)
      };
    }
    return { success: false, errors: ['Unknown validation error'] };
  }
}
```

### 3. Create Storage Service

**File: `src/infrastructure/storage/SecureStorageService.ts`**
```typescript
import { HIPAASecurityService } from '@/services/HIPAASecurityService';

export class SecureStorageService {
  private hipaaService = new HIPAASecurityService();
  
  async store(key: string, data: any): Promise<void> {
    const encrypted = await this.hipaaService.encryptPHI(
      JSON.stringify(data)
    );
    localStorage.setItem(`tmd_${key}`, encrypted);
  }
  
  async retrieve<T>(key: string): Promise<T | null> {
    const encrypted = localStorage.getItem(`tmd_${key}`);
    if (!encrypted) return null;
    
    const decrypted = await this.hipaaService.decryptPHI(encrypted);
    return JSON.parse(decrypted) as T;
  }
  
  async remove(key: string): Promise<void> {
    localStorage.removeItem(`tmd_${key}`);
  }
}
```

## 📝 Implementation Checklist

### Day 1-2: Critical Fixes
- [ ] Fix all test imports (Vitest → Jest)
- [ ] Install missing dependencies
- [ ] Create proper i18n configuration
- [ ] Fix failing tests

### Day 3-5: Core Features
- [ ] Implement 3D pain mapping component
- [ ] Create report generation service
- [ ] Add missing hooks (lazy loading, virtual scroll)
- [ ] Implement data validation layer

### Day 6-10: Integration
- [ ] Create locale files structure
- [ ] Implement secure storage service
- [ ] Add form validation with Zod
- [ ] Create API integration layer

### Day 11-15: Testing & Documentation
- [ ] Achieve 90% test coverage
- [ ] Update all documentation
- [ ] Create deployment guide
- [ ] Performance optimization

## 🚀 Quick Start Commands

```bash
# Fix dependencies
npm install

# Run tests
npm test

# Check coverage
npm run test:coverage

# Build for production
npm run build

# Run performance check
npm run lighthouse:ci
```

## ⚠️ Critical Notes

1. **Medical Accuracy**: All pain scales MUST use 0-4 range per DC/TMD
2. **HIPAA Compliance**: All patient data MUST be encrypted
3. **Accessibility**: All interactive elements MUST be keyboard accessible
4. **Performance**: Initial load MUST be under 2 seconds
5. **Testing**: Medical calculations MUST have 100% test coverage

---

**Remember**: This is a medical application. Patient safety is paramount in every implementation decision.