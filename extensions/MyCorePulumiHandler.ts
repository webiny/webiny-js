import { createImplementation } from "@webiny/di";
import { CorePulumi, UiService } from "webiny/infra";

class MyCorePulumiHandler implements CorePulumi.Interface {
    constructor(private ui: UiService.Interface) {}

    execute(app) {
        this.ui.info("🔮 Executing MyCorePulumiHandler with environment:", app.env);
    }
}

export default createImplementation({
    abstraction: CorePulumi,
    implementation: MyCorePulumiHandler,
    dependencies: [UiService]
});
