import { Endpoint, ApiResponse } from "webiny-api/src";

/**
 * Cars endpoint provides access to the Car entity.
 * @params
 */
class Cars extends Endpoint {
    init(api) {
        api.get("/", async function() {
            return new ApiResponse([{ id: 5 }]);
        });
    }
}

Cars.version = "1.5.0";
Cars.classId = "Middleware.Cars";
export default Cars;
