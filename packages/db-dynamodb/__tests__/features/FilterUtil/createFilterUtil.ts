import { Container } from "@webiny/di";
import { ValueFilterFeature } from "~/feature/ValueFilter";
import { FilterUtil, FilterUtilFeature } from "~/feature/FilterUtil";

export const createFilterUtil = (): FilterUtil.Interface => {
    const container = new Container();
    ValueFilterFeature.register(container);
    FilterUtilFeature.register(container);
    return container.resolve(FilterUtil);
};
