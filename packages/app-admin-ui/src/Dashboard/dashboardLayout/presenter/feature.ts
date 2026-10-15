import { createFeature } from "@webiny/feature/admin";
import { DashboardLayoutPresenter as Abstraction } from "./abstractions.js";
import { DashboardLayoutPresenter } from "./DashboardLayoutPresenter.js";
import { DashboardLayoutRepositoryFeature } from "../repository/feature.js";
import { LoadDashboardLayoutFeature } from "../loadLayout/feature.js";
import { SaveDashboardLayoutFeature } from "../saveLayout/feature.js";

export const DashboardLayoutPresenterFeature = createFeature({
    name: "AdminUI/DashboardLayoutPresenter",
    register(container) {
        DashboardLayoutRepositoryFeature.register(container);
        LoadDashboardLayoutFeature.register(container);
        SaveDashboardLayoutFeature.register(container);
        container.register(DashboardLayoutPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
