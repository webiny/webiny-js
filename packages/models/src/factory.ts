import { Model, ModelParams } from "~/Model";
import { Attribute } from "@webiny/attributes";

export interface CreateModelParams extends ModelParams {
    attributes: Attribute[];
}
export const createModel = (params: CreateModelParams): Model => {
    const model = new Model(params);

    model.addAttributes(params.attributes);

    return model;
};
