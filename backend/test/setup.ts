// Provide valid dummy env before any source module (which validates env on import) loads.
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.API_KEY = 'test-api-key-1234';
process.env.CORS_ORIGIN = '*';
process.env.PORT = '8080';
