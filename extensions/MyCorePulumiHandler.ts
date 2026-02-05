import { Ui } from "webiny/infra";
import { CorePulumi } from "webiny/infra/core";

class MyCorePulumiHandlerImpl implements CorePulumi.Interface {
    constructor(private ui: Ui.Interface) {}

    execute(app: any) {
        this.ui.info("🔮 Executing MyCorePulumiHandler with environment:", app.env);
    }
}

export default CorePulumi.createImplementation({
    implementation: MyCorePulumiHandlerImpl,
    dependencies: [Ui]
});
