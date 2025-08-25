import type { IAccessPattern } from "../abstractions/AccessPattern.js";
import type { Entity } from "@webiny/db-dynamodb/toolbox";
import { DefaultAccessPattern } from "~/storage/accessPatterns/DefaultAccessPattern.js";
import { AppAccessPattern } from "~/storage/accessPatterns/AppAccessPattern.js";
import { AppAndActionAccessPattern } from "~/storage/accessPatterns/AppAndActionAccessPattern.js";
import { AppAndTargetAccessPattern } from "~/storage/accessPatterns/AppAndTargetAccessPattern.js";
import { CreatedByAccessPattern } from "~/storage/accessPatterns/CreatedByAccessPattern.js";
import { CreatedOnAccessPattern } from "~/storage/accessPatterns/CreatedOnAccessPattern.js";

export interface ICreateAccessPatternsParams {
    entity: Entity;
}

export const createAccessPatterns = (
    params: ICreateAccessPatternsParams
): IAccessPattern<unknown>[] => {
    const { entity } = params;
    return [
        new DefaultAccessPattern({
            entity
        }),
        new AppAccessPattern({
            entity,
            index: "GSI1"
        }),
        new AppAndActionAccessPattern({
            entity,
            index: "GSI2"
        }),
        new CreatedByAccessPattern({
            entity,
            index: "GSI3"
        }),
        new CreatedOnAccessPattern({
            entity,
            index: "GSI4"
        }),
        new AppAndTargetAccessPattern({
            entity,
            index: "GSI5"
        })
    ];
};
