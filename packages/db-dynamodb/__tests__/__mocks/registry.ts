import { Container } from "@webiny/di";
import { ValueFilterFeature, ValueFilterRegistry } from "~/features/ValueFilter";

export const createValueFilterRegistry = (): ValueFilterRegistry.Interface => {
    const container = new Container();
    ValueFilterFeature.register(container);
    return container.resolve(ValueFilterRegistry);
};
