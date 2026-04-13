import { Container } from "@webiny/di";
import { ValueFilterFeature } from "@webiny/db-dynamodb/feature/ValueFilter/index.js";

export const createTestContainer = () => {
    const container = new Container();
    ValueFilterFeature.register(container);
    return container;
};
