import { Container } from "@webiny/di";
import { ValueFilterFeature } from "~/features/ValueFilter";
import { FilterUtil, FilterUtilFeature } from "~/features/FilterUtil";

export const createFilterUtil = (): FilterUtil.Interface => {
    const container = new Container();
    ValueFilterFeature.register(container);
    FilterUtilFeature.register(container);
    return container.resolve(FilterUtil);
};
