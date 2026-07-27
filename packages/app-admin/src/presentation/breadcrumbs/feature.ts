import { createFeature } from "@webiny/feature/admin";
import { Container } from "@webiny/di";
import { BreadcrumbsPresenter as Abstraction } from "./abstractions.js";
import { BreadcrumbsPresenter } from "./BreadcrumbsPresenter.js";

export const BreadcrumbsFeature = createFeature({
    name: "Breadcrumbs",
    register(container: Container) {
        // Breadcrumbs have two consumers: the views that declare the trail (writers) and the
        // header UI that renders it (reader). `registerFactory` runs the factory on every
        // `resolve()`, so we memoize a single instance here to guarantee they share one
        // presenter — otherwise writes would never reach the reader.
        const presenter = new BreadcrumbsPresenter();
        container.registerFactory(Abstraction, () => presenter);
    },
    resolve(container: Container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
