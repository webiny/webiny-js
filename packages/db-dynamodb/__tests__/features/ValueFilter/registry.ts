import { Container } from "@webiny/di";
import { ValueFilterFeature, ValueFilterRegistry } from "~/feature/ValueFilter";

export const createRegistry = (): ValueFilterRegistry.Interface => {
    const container = new Container();
    ValueFilterFeature.register(container);
    return container.resolve(ValueFilterRegistry);
};
