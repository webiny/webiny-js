import { Endpoint, ApiResponse } from "webiny-api/src";

class Cars extends Endpoint {
    init(api) {
        api.get("/", async function() {
            return new ApiResponse([{ id: 1 }, { id: 2 }]);
        });

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

Cars.classId = "Middleware.Cars";
export default Cars;
