import { createImplementation } from "@webiny/di";
import { CorePulumi  } from "webiny/infra/features/CorePulumi";
import { UiService } from "webiny/infra/features/UiService";

class MyCorePulumiHandler implements CorePulumi.Interface {
    constructor(private ui: UiService.Interface) {}

    execute(app: any) {
        this.ui.info("🔮 Executing MyCorePulumiHandler with environment:", app.env);
    }
}

export default createImplementation({
    abstraction: CorePulumi,
    implementation: MyCorePulumiHandler,
    dependencies: [UiService]
});
