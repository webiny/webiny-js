import { Ui } from "webiny/infra";
import { AdminPulumi, SetAdminCustomDomains } from "webiny/infra/admin";

class MyAdminPulumiHandlerImpl implements AdminPulumi.Interface {
    constructor(
        private ui: Ui.Interface,
        private setAdminCustomDomains: SetAdminCustomDomains.Interface
    ) {}

    execute(app: any) {
        this.setAdminCustomDomains.execute({
            domains: ["webiny.adriaweb.xyz"],
            sslMethod: "sni-only",
            certificateArn:
                "arn:aws:acm:us-east-1:674320871285:certificate/6c45daa6-a531-4ce8-97b0-477e77dc68f5"
        });
        this.ui.info("🔮 Executing MyAdminPulumiHandler with environment:", app.env);
    }
}

export default AdminPulumi.createImplementation({
    implementation: MyAdminPulumiHandlerImpl,
    dependencies: [Ui, SetAdminCustomDomains]
});
