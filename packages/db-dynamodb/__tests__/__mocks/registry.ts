import { Container } from "@webiny/feature/api";
import { ValueFilterFeature, ValueFilterRegistry } from "~/feature/ValueFilter";

export const createValueFilterRegistry = (): ValueFilterRegistry.Interface => {
    const container = new Container();
    ValueFilterFeature.register(container);
    return container.resolve(ValueFilterRegistry);
};
