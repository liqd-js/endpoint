import Endpoint from "../src/endpoint";
import TestController from "./controllers/test";

const endpoint = Endpoint.create({ controllers: [ TestController ],  port: 80 });