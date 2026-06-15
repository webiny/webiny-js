import { createFeature } from "@webiny/feature/admin";
import { TeamsPresenter } from "./abstractions.js";
import { TeamsPresenterImplementation } from "./TeamsPresenter.js";

export const TeamsPresenterFeature = createFeature({
    name: "AccessManagement/TeamsPresenter",
    register(container) {
        container.register(TeamsPresenterImplementation).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(TeamsPresenter)
        };
    }
});
