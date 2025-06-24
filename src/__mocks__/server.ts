// Simplified mock server for testing without MSW dependency
export const handlers = [
  {
    method: 'GET',
    url: '/api/health',
    response: { status: 'ok', timestamp: new Date().toISOString() },
  },
  {
    method: 'POST',
    url: '/api/assessments',
    response: (body: any) => ({
      id: 'mock-assessment-id',
      code: 'ABC123',
      ...body,
      timestamp: new Date().toISOString(),
    }),
  },
  {
    method: 'GET',
    url: '/api/assessments/:code',
    response: (params: any) => ({
      id: 'mock-assessment-id',
      code: params.code,
      result: {
        riskLevel: 'moderate',
        score: 75,
        recommendations: ['Mock recommendation 1', 'Mock recommendation 2'],
        timestamp: new Date().toISOString(),
        assessmentType: 'comprehensive',
      },
    }),
  },
];

// Simple mock server implementation
export const server = {
  listen: jest.fn(),
  close: jest.fn(),
  resetHandlers: jest.fn(),
  use: jest.fn(),
};
