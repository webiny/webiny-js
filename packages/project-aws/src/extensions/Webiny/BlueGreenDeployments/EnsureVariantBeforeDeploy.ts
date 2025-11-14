import { BeforeDeploy } from "@webiny/project/abstractions/index.js";

class PrintDeploymentInfoAfterDeployImpl implements BeforeDeploy.Interface {
    constructor() {}

    async execute(params: BeforeDeploy.Params) {
        if (params.app !== "blueGreen") {
            return;
        }

        const { env, variant } = params;

        if (!variant?.length) {
            return;
        }
        const message = `Cannot deploy Blue / Green system environment (${env}) with a variant (${variant}).`;
        throw new Error(message);
    }
}

export const EnsureVariantBeforeDeploy = BeforeDeploy.createImplementation({
    implementation: PrintDeploymentInfoAfterDeployImpl,
    dependencies: []
});