import { App } from "webiny-api/src";
import CarsEndpoint_v1 from "./cars-v1";
import CarsEndpoint_v1_5 from "./cars-v1.5";
import CarsEndpoint_v2 from "./cars-v2";

class Middleware extends App {
    constructor() {
        super();

        this.name = "Middleware";
        this.endpoints = [CarsEndpoint_v1, CarsEndpoint_v1_5, CarsEndpoint_v2];
    }
}

export default Middleware;
