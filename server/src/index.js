import http from "http";
import dotenv from "dotenv";
import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { initSocket } from "./config/socket.js";
import { seedQuestions } from "./services/questionSeeder.js";

dotenv.config();

const port = Number(process.env.PORT || 5000);

async function bootstrap() {
  await connectDb();
  await seedQuestions();

  const app = createApp();
  const server = http.createServer(app);

  initSocket(server);

  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
