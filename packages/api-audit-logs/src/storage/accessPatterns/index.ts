import type { IAccessPattern } from "../abstractions/AccessPattern.js";
import type { IConverter } from "~/storage/abstractions/Converter.js";
import type { Entity } from "@webiny/db-dynamodb/toolbox";
import { DefaultAccessPattern } from "~/storage/accessPatterns/DefaultAccessPattern.js";
import { AppAccessPattern } from "~/storage/accessPatterns/AppAccessPattern.js";
import { AppAndActionAccessPattern } from "~/storage/accessPatterns/AppAndActionAccessPattern.js";
import { AppAndTargetAccessPattern } from "~/storage/accessPatterns/AppAndTargetAccessPattern.js";
import { CreatedByAccessPattern } from "~/storage/accessPatterns/CreatedByAccessPattern.js";
import { CreatedOnAccessPattern } from "~/storage/accessPatterns/CreatedOnAccessPattern.js";

export interface ICreateAccessPatternsParams {
    entity: Entity;
    converter: IConverter;
}

export const createAccessPatterns = (
    params: ICreateAccessPatternsParams
): IAccessPattern<unknown>[] => {
    const { entity, converter } = params;
    return [
        new DefaultAccessPattern({
            entity,
            converter
        }),
        new AppAccessPattern({
            entity,
            converter,
            index: "GSI1"
        }),
        new AppAndActionAccessPattern({
            entity,
            converter,
            index: "GSI2"
        }),
        new CreatedByAccessPattern({
            entity,
            converter,
            index: "GSI3"
        }),
        new CreatedOnAccessPattern({
            entity,
            converter,
            index: "GSI4"
        }),
        new AppAndTargetAccessPattern({
            entity,
            converter,
            index: "GSI5"
        })
    ];
};
