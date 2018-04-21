import type { Attribute } from "webiny-model";
import type _Schema from "./lib/graphql/Schema";
import type { Entity as _Entity } from "./lib/index";

export type Schema = _Schema;
export type Entity = _Entity;

export type ImageProcessor = ({
    image: Buffer,
    transformations: Array<{ action: string }>
}) => Buffer;

export type AttributeToTypeParams = {
    attr: Attribute,
    schema: Schema,
    modelToType: Function
};
