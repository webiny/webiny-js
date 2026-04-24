import { createFeature } from "@webiny/feature/api";
import { CognitoService } from "./CognitoService.js";
import { CognitoConfig } from "./abstractions.js";

export type UserPoolConfig = {
    region: string;
    userPoolId: string;
};

export const CognitoServiceFeature = createFeature<UserPoolConfig>({
    name: "cognitoService",
    register(container, config) {
        container.register(CognitoService).inSingletonScope();

        container.registerInstance(CognitoConfig, config);
    }
});
