// Runs before each test file's module graph is evaluated, so config/env.js
// picks up real values regardless of import order. MONGO_URI is a harmless
// placeholder - tests connect Mongoose directly to their own in-memory
// MongoMemoryServer instance instead of going through connectDB().
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_do_not_use_in_production';
process.env.JWT_EXPIRES_IN = '7d';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/unused-placeholder';
process.env.PORT = '0';
