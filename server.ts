import { ENVS } from "./src/commons/configs/env";
import createApp from "./src/infrastructure/http/container";

const startServer = async () => {
  const app = createApp();

  const PORT = ENVS.APP_PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Error starting server:", err);
});
