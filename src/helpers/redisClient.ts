import { createClient } from 'redis';

// Create a Redis client
const redisClient = createClient();

// Handle connection and error events
redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

redisClient.on('error', (err) => {
  console.error('Error connecting to Redis:', err);
});
redisClient.connect();

export default redisClient;
