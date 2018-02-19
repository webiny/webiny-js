import { Endpoint, ApiResponse } from "webiny-api";

/**
 * Cars endpoint provides access to the Car entity.
 * @params
 */
class Cars extends Endpoint {
    init(api) {
        api.get("ListCars", "/", async function() {
            return new ApiResponse([{ id: 1 }, { id: 2 }]);
        });

        api.get("GetCar", "/:id", function({ id }) {
            return new ApiResponse({ id: parseInt(id) });
        });

        api.get("GetCarRacesByYear", "/:id/races/:year", function({ id, year }) {
            return new ApiResponse({ id: parseInt(id), year: parseInt(year) });
        });

        api.post("CreateCar", "/", function({ req: { body } }) {
            return new ApiResponse(body);
        });

        api.patch("UpdateCar", ":id", function({ req: { body }, id }) {
            return new ApiResponse({ ...body, id: parseInt(id) });
        });

        api.delete("DeleteCar", ":id", function() {
            return new ApiResponse(true);
        });

        api.get("GetArticle", "/article/*url", function({ url }) {
            return new ApiResponse({ url });
        });

        api.get("InvalidResponse", "/invalid", function() {
            return { key: "invalid" };
        });
    }
}

Cars.version = "1.0.0";
Cars.classId = "Middleware.Cars";
export default Cars;
