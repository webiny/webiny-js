import { BeforeDeploy, ProjectSdkParamsService } from "@webiny/project/abstractions/index.js";

class EnsureVariantBeforeDeployImpl implements BeforeDeploy.Interface {
    constructor(private projectSdkParamsService: ProjectSdkParamsService.Interface) {}

    async execute(params: BeforeDeploy.Params) {
        if (params.app !== "blueGreen") {
            return;
        }

        const sdkParams = this.projectSdkParamsService.get();
        const { env, variant } = sdkParams;

        if (!variant?.length) {
            return;
        }
        const message = `Cannot deploy Blue / Green system environment (${env}) with a variant (${variant}).`;
        throw new Error(message);
    }
}

const EnsureVariantBeforeDeploy = BeforeDeploy.createImplementation({
    implementation: EnsureVariantBeforeDeployImpl,
    dependencies: [ProjectSdkParamsService]
});

export default EnsureVariantBeforeDeploy;
