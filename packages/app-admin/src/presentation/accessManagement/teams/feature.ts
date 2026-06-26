import { createFeature } from "@webiny/feature/admin";
import { TeamsPresenter as Abstraction } from "./abstractions.js";
import { TeamsPresenter } from "./TeamsPresenter.js";

export const TeamsPresenterFeature = createFeature({
    name: "AccessManagement/TeamsPresenter",
    register(container) {
        container.register(TeamsPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
