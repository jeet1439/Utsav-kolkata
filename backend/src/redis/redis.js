import Redis from "ioredis";

const redis = new Redis({
  host: "127.0.0.1",
  port: 6379,
  retryStrategy: (times) => {
    if (times > 5) return null;
    return 2000;
  },
});

redis.on("connect", () => {
  console.log("Connected to Redis");
});

redis.on("ready", () => {
  console.log("Redis is ready");
});

redis.on("error", (err) => {
  console.error("Redis Error:", err.message);
});

export default redis;