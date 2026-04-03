import { Plugin } from "@webiny/plugins";
import type { Container } from "@webiny/di";
import type { FeatureDefinition } from "@webiny/feature/api/createFeature.js";

export class RegisterFeaturePlugin extends Plugin {
    public static override readonly type: string = "register.container.feature";

    public constructor(private readonly feature: FeatureDefinition<unknown>) {
        super();
    }

    public async apply(container: Container): Promise<void> {
        this.feature.register(container);
    }
}

export const createRegisterFeaturePlugin = (feature: FeatureDefinition<unknown>) => {
    return new RegisterFeaturePlugin(feature);
};
