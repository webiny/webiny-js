import { App } from "webiny-api/src";
import CarsEndpoint_v1 from "./cars-v1";
import CarsEndpoint_v1_5 from "./cars-v1.5";
import CarsEndpoint_v2 from "./cars-v2";

class Middleware extends App {
    constructor() {
        super();

        this.name = "Middleware";
        this.endpoints = [CarsEndpoint_v1, CarsEndpoint_v1_5, CarsEndpoint_v2];

        this.extendEndpoint("Middleware.Cars", ({ api }) => {
            api.get("/extended/:param", function({ param }) {
                return { extendedParam: param };
            });

            // Override existing POST method, modify body and execute the original (parent) method
            api.post("/", function(params, parent) {
                params.req.body.extended1 = true;
                return parent(params);
            });

            // Override the overridden method
            api.post("/", function(params, parent) {
                params.req.body.extended2 = true;
                return parent(params);
            });
        });
    }
}

export default Middleware;
