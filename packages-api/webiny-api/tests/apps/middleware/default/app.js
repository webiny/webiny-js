import { App } from "webiny-api/src";
import CarsEndpoint from "./cars";

class Middleware extends App {
    constructor() {
        super();

        this.name = "Middleware";
        this.endpoints = [CarsEndpoint];

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
