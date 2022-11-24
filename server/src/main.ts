import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as dotenv from "dotenv";
import * as path from "path";
import * as redis from "redis";
import * as cookieParser from "cookie-parser";
import { testFunction } from "redis/user";

dotenv.config({
  path: path.resolve(".env"),
});
const { REDIS_PASSWORD, REDIS_HOST, REDIS_PORT } = process.env;

const redisClient = redis.createClient({
  legacyMode: true,
  url: `redis://:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}`,
});

redisClient.on("connect", () => {
  console.info("Redis connected!");

  testFunction(1, "아임더베스트 테스트");
});

redisClient.on("error", err => {
  console.error("Redis Client Error", err);
});

redisClient.connect().then();
export const redisCli = redisClient.v4;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  await app.listen(3000);
}
bootstrap();
