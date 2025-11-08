import { createImplementation } from "@webiny/di";
import { ApiBeforeDeploy, UiService } from "webiny/infra";

class MyApiBeforeDeploy implements ApiBeforeDeploy.Interface {
    constructor(private ui: UiService.Interface) {}

    execute(params: ApiBeforeDeploy.Params) {
        this.ui.info("This is my custom before deploy API implementation.");
    }
}

export default createImplementation({
    abstraction: ApiBeforeDeploy,
    implementation: MyApiBeforeDeploy,
    dependencies: [UiService]
});
