import { AttributeParams } from "./Attribute";
import { StringAttribute } from "./StringAttribute";
import { BooleanAttribute } from "./BooleanAttribute";
import { DateTimeAttribute } from "./DateTimeAttribute";
import { ListAttribute } from "./ListAttribute";
import { NumberAttribute } from "./NumberAttribute";
import { ObjectAttribute } from "./ObjectAttribute";

export type CreateAttributeParams = Omit<AttributeParams, "type">;

export const createBooleanAttribute = (params: CreateAttributeParams): BooleanAttribute => {
    return new BooleanAttribute({
        ...params
    });
};

export const createDateTimeAttribute = (params: CreateAttributeParams): DateTimeAttribute => {
    return new DateTimeAttribute({
        ...params
    });
};

export const createListAttribute = (params: CreateAttributeParams): ListAttribute => {
    return new ListAttribute({
        ...params
    });
};

export const createNumberAttribute = (params: CreateAttributeParams): NumberAttribute => {
    return new NumberAttribute({
        ...params
    });
};

export const createObjectAttribute = (params: CreateAttributeParams): ObjectAttribute => {
    return new ObjectAttribute({
        ...params
    });
};

export const createStringAttribute = (params: CreateAttributeParams): StringAttribute => {
    return new StringAttribute({
        ...params
    });
};
