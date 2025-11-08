import { createImplementation } from "@webiny/di";
import { ApiAfterDeploy, UiService } from "webiny/infra";

class MyApiAfterDeploy implements ApiAfterDeploy.Interface {
    constructor(private ui: UiService.Interface) {}

    execute(params: ApiAfterDeploy.Params) {
        this.ui.info("This is my custom after deploy API implementation.");
    }
}

export default createImplementation({
    abstraction: ApiAfterDeploy,
    implementation: MyApiAfterDeploy,
    dependencies: [UiService]
});
