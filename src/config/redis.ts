import { createClient } from "redis";

const redis = createClient({
  socket: { host: "localhost", port: 6379 },
});

redis.connect().catch(console.error);

export default redis;