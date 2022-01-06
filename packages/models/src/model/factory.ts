import { Model, ModelParams } from "./Model";

export const createModel = (params: ModelParams): Model => {
    return new Model(params);
};
