import { app } from "./app";
import { env } from "./env";
import { setupSocket } from "./lib/socket";

setupSocket(app.server);

app.listen({
   port: env.PORT,
   host: "0.0.0.0",
}).then(() => {
   console.log("server is running 🎉.");
});
