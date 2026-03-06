import Redis from "ioredis";

const redis = new Redis({
  host: "127.0.0.1",
  port: 6379,
  retryStrategy: (times) => {
    if (times > 5) return null;
    return 2000;
  }
});

redis.on("error", (err) => {
  console.error("Redis error:", err.message);
});

export default redis;