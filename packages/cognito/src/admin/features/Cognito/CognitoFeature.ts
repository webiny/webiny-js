import { createFeature } from "@webiny/feature/admin";
import { CognitoPresenter } from "./CognitoPresenter.js";

export const CognitoFeature = createFeature({
    name: "Cognito",
    register(container) {
        container.register(CognitoPresenter).inSingletonScope();

        return {
            presenter: container.resolve(CognitoPresenter)
        };
    }
});
