import { createFeature } from "@webiny/feature/admin";
import { CognitoPresenter } from "./CognitoPresenter.js";
import { CognitoPresenter as Presenter } from "./abstractions.js";

export const CognitoFeature = createFeature({
    name: "Cognito",
    register(container) {
        container.register(CognitoPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Presenter)
        };
    }
});
