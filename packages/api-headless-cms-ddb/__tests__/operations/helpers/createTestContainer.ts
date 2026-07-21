import { Container } from "@webiny/feature/api";
import { ValueFilterFeature } from "@webiny/db-utils";
import { FilterRegistriesFeature } from "@webiny/api-headless-cms-storage";

export const createTestContainer = () => {
    const container = new Container();
    ValueFilterFeature.register(container);
    FilterRegistriesFeature.register(container);
    return container;
};
