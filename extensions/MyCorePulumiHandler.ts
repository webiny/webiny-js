import { CorePulumi } from "webiny/infra/features/CorePulumi";
import { UiService } from "webiny/infra/features/UiService";

class MyCorePulumiHandlerImpl implements CorePulumi.Interface {
    constructor(private ui: UiService.Interface) {}

    execute(app: any) {
        this.ui.info("🔮 Executing MyCorePulumiHandler with environment:", app.env);
    }
}

export const MyCorePulumiHandler = CorePulumi.createImplementation({
    implementation: MyCorePulumiHandlerImpl,
    dependencies: [UiService]
});
