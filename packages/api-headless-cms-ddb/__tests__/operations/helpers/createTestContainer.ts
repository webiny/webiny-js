import { Container } from "@webiny/di";
import { ValueFilterFeature } from "@webiny/db-utils";

export const createTestContainer = () => {
    const container = new Container();
    ValueFilterFeature.register(container);
    return container;
};
