import { Endpoint, ApiResponse } from "webiny-api/src";

/**
 * Cars endpoint provides access to the Car entity.
 * @params
 */
class Cars extends Endpoint {
    init(api) {
        /**
         * @event GET /cars
         * @return {ApiResponse} A list of cars extracted using Car entity.
         * @example
         * GET {apiUrl}/cars?_fields=id,name
         *
         * {
         *   "list": [{
         *     "id": 76,
         *     "name": "Tesla"
         *   }],
         *   "meta": {
         *     "_fields": "id,name"
         *   }
         * }
         */
        api.get("/", async function() {
            return new ApiResponse([{ id: 1 }, { id: 2 }]);
        });

        /**
         * @event GET /cars/:id
         * @param {mixed} id Car ID
         * @return {ApiResponse} A single car extracted using Car entity.
         * @example
         * GET {apiUrl}/cars/76?_fields=id,name
         *
         * {
         *   "data": {
         *     "id": 76,
         *     "name": "Tesla"
         *   }
         * }
         */
        api.get("/:id", function({ id }) {
            return { data: { id: parseInt(id) } };
        });

        api.get("/:id/races/:year", function({ id, year }) {
            return new ApiResponse({ id: parseInt(id), year: parseInt(year) });
        });

        api.post("/", function({ req: { body } }) {
            return new ApiResponse(body);
        });

        api.patch(":id", function({ req: { body }, id }) {
            return new ApiResponse({ ...body, id: parseInt(id) });
        });

        api.delete(":id", function() {
            return new ApiResponse(true);
        });

        api.get("/article/*url", function({ url }) {
            return { url };
        });
    }
}

Cars.version = "1.0.0";
Cars.classId = "Middleware.Cars";
export default Cars;
