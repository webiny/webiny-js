import { Ui } from "webiny/infra";
import { Pulumi } from "webiny/infra/core";

class MyCorePulumiHandlerImpl implements Pulumi.Interface {
    constructor(private ui: Ui.Interface) {}

    execute(app: any) {
        this.ui.info("🔮 Executing MyCorePulumiHandler with environment:", app.env);
    }
}

const MyCorePulumiHandler = Pulumi.createImplementation({
    implementation: MyCorePulumiHandlerImpl,
    dependencies: [Ui]
});

export default MyCorePulumiHandler;
