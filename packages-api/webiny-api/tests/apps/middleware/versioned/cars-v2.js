import { Endpoint, ApiResponse } from "webiny-api/src";

/**
 * Cars endpoint provides access to the Car entity.
 * @params
 */
class Cars extends Endpoint {
    init(api) {
        api.get("ListCars", "/", async function() {
            return new ApiResponse([{ id: 3 }, { id: 4 }]);
        });
    }
}

Cars.version = "2.0.0";
Cars.classId = "Middleware.Cars";
export default Cars;
