import { ModelBuilder, Params } from "./ModelBuilder";

export const modelBuilderFactory = (params: Params): ModelBuilder => {
    return new ModelBuilder(params);
};
