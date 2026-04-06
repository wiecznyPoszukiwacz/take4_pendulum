import { ApiHandler } from "./modules/ApiHandler.mjs";
import { Server } from "./modules/Server.mjs";
import { Pendulum } from "./pendulum/Pendulum.mjs";

const PORT = 3000;


const pendulum = new Pendulum()

const apiHandler = new ApiHandler(pendulum)

const server = new Server(apiHandler);
server.run(PORT);
