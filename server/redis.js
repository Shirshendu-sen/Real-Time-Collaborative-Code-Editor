import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Redis subscriber connections are dedicated to subscriptions, so publishing
// uses a separate connection.
export const publisher = new Redis(REDIS_URL);
export const subscriber = new Redis(REDIS_URL);

publisher.on("connect", () => console.log("Redis publisher connected"));
subscriber.on("connect", () => console.log("Redis subscriber connected"));

publisher.on("error", (error) => console.error("Redis publisher error:", error.message));
subscriber.on("error", (error) => console.error("Redis subscriber error:", error.message));