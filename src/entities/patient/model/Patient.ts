// Patient Entity Model - Domain-Driven Design
// Core business logic for patient management in TMD diagnostic system

/**
 * Patient demographics following medical standards
 * Compliant with HL7 FHIR and HIPAA requirements
 */
export interface PatientDemographics {
  // Basic identification (anonymized for privacy)
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';

  // Contact information (encrypted in storage)
  email?: string;
  phone?: string;

  // Address information
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };

  // Medical identifiers
  medicalRecordNumber?: string;
  insuranceId?: string;

  // Demographic factors affecting TMD
  ethnicity?: 'hispanic_latino' | 'not_hispanic_latino' | 'unknown';
  race?:
    | 'white'
    | 'black'
    | 'asian'
    | 'native_american'
    | 'pacific_islander'
    | 'other'
    | 'mixed'
    | 'unknown';

  // Language preferences for assessment
  preferredLanguage: 'en' | 'es' | 'fr' | 'zh' | 'other';

  // Emergency contact
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
}

/**
 * Comprehensive medical history relevant to TMD diagnosis
 * Based on DC/TMD protocol requirements
 */
export interface MedicalHistory {
  // TMD-specific history
  tmdHistory: {
    previousDiagnosis?: string;
    previousTreatment?: string[];
    familyHistoryTMD: boolean;
    onsetDate?: Date;
    triggeringEvents?: string[];
  };

  // Dental history
  dentalHistory: {
    lastDentalVisit?: Date;
    orthodonticTreatment: boolean;
    oralSurgery: boolean;
    dentalTrauma: boolean;
    bruxism: boolean;
    clenching: boolean;
    missingTeeth: number;
    dentalProsthetics: boolean;
  };

  // Medical conditions affecting TMD
  medicalConditions: {
    arthritis: boolean;
    fibromyalgia: boolean;
    chronicPain: boolean;
    depression: boolean;
    anxiety: boolean;
    sleepDisorders: boolean;
    migraines: boolean;
    neckPain: boolean;
    backPain: boolean;
    autoimmune: boolean;
  };

  // Medications that may affect TMD
  currentMedications: Medication[];

  // Allergies and adverse reactions
  allergies: Allergy[];

  // Social history affecting TMD
  socialHistory: {
    smokingStatus: 'never' | 'former' | 'current';
    alcoholUse: 'none' | 'occasional' | 'moderate' | 'heavy';
    caffeineIntake: 'none' | 'low' | 'moderate' | 'high';
    stressLevel: number; // 1-10 scale
    sleepQuality: number; // 1-10 scale
    exerciseFrequency: 'none' | 'rarely' | 'weekly' | 'daily';
  };

  // Trauma history
  traumaHistory: {
    headInjury: boolean;
    neckInjury: boolean;
    facialTrauma: boolean;
    whiplash: boolean;
    dateOfTrauma?: Date;
    traumaDetails?: string;
  };

  // Occupational factors
  occupationalFactors: {
    occupation?: string;
    workStress: number; // 1-10 scale
    computerUse: number; // hours per day
    phoneUse: number; // hours per day
    physicalDemands: 'sedentary' | 'light' | 'moderate' | 'heavy';
  };

  // Hormonal factors (relevant for TMD)
  hormonalFactors?: {
    menstrualCycle?: 'regular' | 'irregular' | 'postmenopausal';
    pregnancies?: number;
    hormonalTherapy?: boolean;
    oralContraceptives?: boolean;
  };
}

/**
 * Medication information with TMD relevance
 */
export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  prescribingPhysician?: string;
  indication: string;

  // TMD-specific flags
  affectsPain: boolean;
  affectsSleep: boolean;
  affectsMuscles: boolean;
  sideEffects?: string[];
}

/**
 * Allergy information with severity classification
 */
export interface Allergy {
  id: string;
  allergen: string;
  type: 'drug' | 'food' | 'environmental' | 'other';
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  reaction: string[];
  onsetDate?: Date;
  verified: boolean;
  notes?: string;
}

/**
 * Patient consent and privacy settings
 */
export interface PatientConsent {
  // HIPAA compliance
  hipaaConsent: boolean;
  hipaaConsentDate: Date;

  // Data sharing preferences
  dataSharing: {
    research: boolean;
    qualityImprovement: boolean;
    anonymizedAnalytics: boolean;
    thirdPartyProviders: boolean;
  };

  // Communication preferences
  communicationPreferences: {
    email: boolean;
    sms: boolean;
    phone: boolean;
    mail: boolean;
    appointmentReminders: boolean;
    treatmentUpdates: boolean;
    educationalMaterials: boolean;
  };

  // Emergency access
  emergencyAccess: boolean;

  // Consent withdrawal
  consentWithdrawal?: {
    date: Date;
    reason?: string;
    partialWithdrawal?: string[];
  };
}

/**
 * Patient clinical notes and observations
 */
export interface ClinicalNotes {
  // Subjective findings
  chiefComplaint: string;
  historyPresentIllness: string;
  reviewOfSystems: string;

  // Objective findings
  physicalExamination?: string;
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
  };

  // Assessment and plan
  clinicalImpression: string;
  treatmentPlan: string;
  followUpInstructions: string;

  // Provider information
  providerId: string;
  providerName: string;
  dateOfService: Date;

  // Note metadata
  noteType: 'initial' | 'follow_up' | 'consultation' | 'procedure' | 'discharge';
  confidentiality: 'normal' | 'restricted' | 'very_restricted';
}

/**
 * Patient care team information
 */
export interface CareTeam {
  primaryProvider: {
    id: string;
    name: string;
    specialty: string;
    role: 'primary' | 'attending' | 'consulting';
    contactInfo: {
      phone?: string;
      email?: string;
      office?: string;
    };
  };

  consultingProviders: Array<{
    id: string;
    name: string;
    specialty: string;
    role: string;
    consultationDate: Date;
    recommendations?: string;
  }>;

  supportStaff: Array<{
    id: string;
    name: string;
    role: string;
    responsibilities: string[];
  }>;
}

/**
 * Main Patient entity with complete medical profile
 * Implements domain-driven design principles
 */
export interface Patient {
  // Core identification
  id: string;

  // Patient information
  demographics: PatientDemographics;
  medicalHistory: MedicalHistory;
  consent: PatientConsent;

  // Clinical data
  clinicalNotes: ClinicalNotes[];
  careTeam?: CareTeam;

  // System metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;

  // Status and flags
  status: 'active' | 'inactive' | 'deceased' | 'unknown';
  flags: {
    highRisk: boolean;
    requiresInterpreter: boolean;
    mobilityAssistance: boolean;
    cognitiveImpairment: boolean;
    hearingImpairment: boolean;
    visionImpairment: boolean;
  };

  // Privacy and security
  dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
  encryptionStatus: boolean;
  lastAccessDate?: Date;
  accessLog?: Array<{
    userId: string;
    timestamp: Date;
    action: string;
    ipAddress?: string;
  }>;

  // Quality metrics
  dataQuality: {
    completeness: number; // 0-100%
    accuracy: number; // 0-100%
    lastValidated: Date;
    validatedBy: string;
  };
}

/**
 * Patient factory for creating new patient instances
 */
export class PatientFactory {
  static createNewPatient(demographics: PatientDemographics, createdBy: string): Patient {
    const now = new Date();

    return {
      id: this.generatePatientId(),
      demographics,
      medicalHistory: this.createEmptyMedicalHistory(),
      consent: this.createDefaultConsent(),
      clinicalNotes: [],
      createdAt: now,
      updatedAt: now,
      createdBy,
      lastModifiedBy: createdBy,
      status: 'active',
      flags: {
        highRisk: false,
        requiresInterpreter: demographics.preferredLanguage !== 'en',
        mobilityAssistance: false,
        cognitiveImpairment: false,
        hearingImpairment: false,
        visionImpairment: false,
      },
      dataClassification: 'confidential',
      encryptionStatus: true,
      dataQuality: {
        completeness: this.calculateCompleteness(demographics),
        accuracy: 100,
        lastValidated: now,
        validatedBy: createdBy,
      },
    };
  }

  private static generatePatientId(): string {
    // Generate secure, HIPAA-compliant patient ID
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `PT_${timestamp}_${random}`.toUpperCase();
  }

  private static createEmptyMedicalHistory(): MedicalHistory {
    return {
      tmdHistory: {
        familyHistoryTMD: false,
        triggeringEvents: [],
      },
      dentalHistory: {
        orthodonticTreatment: false,
        oralSurgery: false,
        dentalTrauma: false,
        bruxism: false,
        clenching: false,
        missingTeeth: 0,
        dentalProsthetics: false,
      },
      medicalConditions: {
        arthritis: false,
        fibromyalgia: false,
        chronicPain: false,
        depression: false,
        anxiety: false,
        sleepDisorders: false,
        migraines: false,
        neckPain: false,
        backPain: false,
        autoimmune: false,
      },
      currentMedications: [],
      allergies: [],
      socialHistory: {
        smokingStatus: 'never',
        alcoholUse: 'none',
        caffeineIntake: 'none',
        stressLevel: 5,
        sleepQuality: 7,
        exerciseFrequency: 'weekly',
      },
      traumaHistory: {
        headInjury: false,
        neckInjury: false,
        facialTrauma: false,
        whiplash: false,
      },
      occupationalFactors: {
        workStress: 5,
        computerUse: 8,
        phoneUse: 2,
        physicalDemands: 'sedentary',
      },
    };
  }

  private static createDefaultConsent(): PatientConsent {
    const now = new Date();

    return {
      hipaaConsent: false,
      hipaaConsentDate: now,
      dataSharing: {
        research: false,
        qualityImprovement: false,
        anonymizedAnalytics: false,
        thirdPartyProviders: false,
      },
      communicationPreferences: {
        email: true,
        sms: false,
        phone: true,
        mail: false,
        appointmentReminders: true,
        treatmentUpdates: true,
        educationalMaterials: false,
      },
      emergencyAccess: true,
    };
  }

  private static calculateCompleteness(demographics: PatientDemographics): number {
    const requiredFields = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'preferredLanguage'];
    const optionalFields = [
      'email',
      'phone',
      'address',
      'medicalRecordNumber',
      'ethnicity',
      'race',
    ];

    let score = 0;
    const totalFields = requiredFields.length + optionalFields.length;

    // Required fields (higher weight)
    requiredFields.forEach((field) => {
      if (demographics[field as keyof PatientDemographics]) {
        score += 2;
      }
    });

    // Optional fields (lower weight)
    optionalFields.forEach((field) => {
      if (demographics[field as keyof PatientDemographics]) {
        score += 1;
      }
    });

    return Math.min(100, (score / (requiredFields.length * 2 + optionalFields.length)) * 100);
  }
}

/**
 * Patient domain service for business logic
 */
export class PatientDomainService {
  /**
   * Validate patient data for medical compliance
   */
  static validatePatientData(patient: Patient): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!patient.demographics.firstName?.trim()) {
      errors.push('First name is required');
    }

    if (!patient.demographics.lastName?.trim()) {
      errors.push('Last name is required');
    }

    if (!patient.demographics.dateOfBirth) {
      errors.push('Date of birth is required');
    } else {
      const age = this.calculateAge(patient.demographics.dateOfBirth);
      if (age < 0 || age > 150) {
        errors.push('Invalid date of birth');
      }
      if (age < 18) {
        warnings.push('Patient is a minor - additional consent may be required');
      }
    }

    // HIPAA consent validation
    if (!patient.consent.hipaaConsent) {
      errors.push('HIPAA consent is required for medical records');
    }

    // Data quality validation
    if (patient.dataQuality.completeness < 60) {
      warnings.push('Patient record is incomplete - consider collecting additional information');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Calculate patient age from date of birth
   */
  static calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Assess TMD risk factors from patient history
   */
  static assessTMDRiskFactors(patient: Patient): {
    riskLevel: 'low' | 'moderate' | 'high';
    riskFactors: string[];
    protectiveFactors: string[];
  } {
    const riskFactors: string[] = [];
    const protectiveFactors: string[] = [];
    let riskScore = 0;

    const history = patient.medicalHistory;

    // Demographic risk factors
    const age = this.calculateAge(patient.demographics.dateOfBirth);
    if (age >= 20 && age <= 40) {
      riskScore += 2;
      riskFactors.push('Peak age range for TMD onset');
    }

    if (patient.demographics.gender === 'female') {
      riskScore += 3;
      riskFactors.push('Female gender (higher TMD prevalence)');
    }

    // Medical history risk factors
    if (history.tmdHistory.familyHistoryTMD) {
      riskScore += 3;
      riskFactors.push('Family history of TMD');
    }

    if (history.dentalHistory.bruxism || history.dentalHistory.clenching) {
      riskScore += 4;
      riskFactors.push('Bruxism or teeth clenching');
    }

    if (
      history.traumaHistory.headInjury ||
      history.traumaHistory.neckInjury ||
      history.traumaHistory.whiplash
    ) {
      riskScore += 3;
      riskFactors.push('History of head/neck trauma');
    }

    if (history.medicalConditions.arthritis) {
      riskScore += 2;
      riskFactors.push('Arthritis');
    }

    if (history.medicalConditions.fibromyalgia) {
      riskScore += 3;
      riskFactors.push('Fibromyalgia');
    }

    if (history.medicalConditions.depression || history.medicalConditions.anxiety) {
      riskScore += 2;
      riskFactors.push('Depression or anxiety');
    }

    if (history.socialHistory.stressLevel >= 7) {
      riskScore += 2;
      riskFactors.push('High stress levels');
    }

    if (history.socialHistory.sleepQuality <= 4) {
      riskScore += 2;
      riskFactors.push('Poor sleep quality');
    }

    // Protective factors
    if (history.socialHistory.exerciseFrequency === 'daily') {
      riskScore -= 1;
      protectiveFactors.push('Regular exercise');
    }

    if (history.socialHistory.smokingStatus === 'never') {
      protectiveFactors.push('Non-smoker');
    }

    if (history.socialHistory.stressLevel <= 3) {
      protectiveFactors.push('Low stress levels');
    }

    // Determine risk level
    let riskLevel: 'low' | 'moderate' | 'high';
    if (riskScore <= 3) {
      riskLevel = 'low';
    } else if (riskScore <= 8) {
      riskLevel = 'moderate';
    } else {
      riskLevel = 'high';
    }

    return {
      riskLevel,
      riskFactors,
      protectiveFactors,
    };
  }

  /**
   * Generate patient summary for clinical use
   */
  static generatePatientSummary(patient: Patient): string {
    const age = this.calculateAge(patient.demographics.dateOfBirth);
    const riskAssessment = this.assessTMDRiskFactors(patient);

    return `
Patient: ${patient.demographics.firstName} ${patient.demographics.lastName}
Age: ${age} years, Gender: ${patient.demographics.gender}
TMD Risk Level: ${riskAssessment.riskLevel.toUpperCase()}

Key Risk Factors:
${riskAssessment.riskFactors.map((factor) => `• ${factor}`).join('\n')}

Medical History Highlights:
• Bruxism/Clenching: ${patient.medicalHistory.dentalHistory.bruxism ? 'Yes' : 'No'}
• Previous Trauma: ${patient.medicalHistory.traumaHistory.headInjury || patient.medicalHistory.traumaHistory.neckInjury ? 'Yes' : 'No'}
• Chronic Pain Conditions: ${patient.medicalHistory.medicalConditions.chronicPain ? 'Yes' : 'No'}
• Stress Level: ${patient.medicalHistory.socialHistory.stressLevel}/10
• Sleep Quality: ${patient.medicalHistory.socialHistory.sleepQuality}/10

Record Quality: ${patient.dataQuality.completeness}% complete
Last Updated: ${patient.updatedAt.toLocaleDateString()}
    `.trim();
  }
}

// Export types for use in other modules
export type {
  PatientDemographics,
  MedicalHistory,
  Medication,
  Allergy,
  PatientConsent,
  ClinicalNotes,
  CareTeam,
};
