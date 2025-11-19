// Jest setup file
beforeEach(() => {
  // Mock console methods to reduce noise during tests
  global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
});

afterEach(() => {
  jest.clearAllMocks();
});