import Redis from "ioredis";

const redis = new Redis({
  host: "redis-18337.crce295.us-east-1-1.ec2.cloud.redislabs.com",
  port: 18337,
  username: "default",
  password: "4aYRPeojGCJm3dWTsT33VE0oQS5kQ5K8",
  retryStrategy: (times) => {
    if (times > 5) return null;
    return 2000;
  },
});

redis.on("error", (err) => {
  console.error("Redis error:", err.message);
});

export default redis;