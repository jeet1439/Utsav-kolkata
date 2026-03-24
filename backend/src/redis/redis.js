import Redis from "ioredis";

const redis = new Redis({
  host: "redis-18785.c258.us-east-1-4.ec2.cloud.redislabs.com",
  port: 18785,
  username: "default",
  password: "fHnT5GgCH01olQRsGzwoIZNwO1v3GUVh",
  retryStrategy: (times) => {
    if (times > 5) return null;
    return 2000;
  },
});

redis.on("error", (err) => {
  console.error("Redis error:", err.message);
});

export default redis;