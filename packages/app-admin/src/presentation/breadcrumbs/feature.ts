import { createFeature } from "@webiny/feature/admin";
import { Container } from "@webiny/di";
import { RouterPresenter } from "@webiny/app/features/router/abstractions.js";
import { BreadcrumbsPresenter as Abstraction } from "./abstractions.js";
import { Breadcrumb } from "./abstractions.js";
import { BreadcrumbsPresenter } from "./BreadcrumbsPresenter.js";

export const BreadcrumbsFeature = createFeature({
    name: "Breadcrumbs",
    register(container: Container) {
        // Breadcrumbs have two consumers: the views that declare a trail (writers) and the
        // header UI that renders it (reader). `registerFactory` runs the factory on every
        // `resolve()`, so we memoize a single instance here to guarantee they share one
        // presenter — otherwise writes would never reach the reader.
        const presenter = new BreadcrumbsPresenter(
            () => container.resolveAll(Breadcrumb),
            () => container.resolve(RouterPresenter).vm.currentRoute
        );
        container.registerFactory(Abstraction, () => presenter);
    },
    resolve(container: Container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
