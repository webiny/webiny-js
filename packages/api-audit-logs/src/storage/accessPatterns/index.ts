import type { IAccessPattern } from "../abstractions/AccessPattern.js";
import type { Entity } from "@webiny/db-dynamodb/toolbox";
import { DefaultAccessPattern } from "~/storage/accessPatterns/DefaultAccessPattern.js";
import { AppAccessPattern } from "~/storage/accessPatterns/AppAccessPattern.js";
// import { AppAndActionAccessPattern } from "~/storage/accessPatterns/AppAndActionAccessPattern.js";
// import { AppAndTargetAccessPattern } from "~/storage/accessPatterns/AppAndTargetAccessPattern.js";
// import { CreatedByAccessPattern } from "~/storage/accessPatterns/CreatedByAccessPattern.js";
// import { CreatedOnAccessPattern } from "~/storage/accessPatterns/CreatedOnAccessPattern.js";
import { AppCreatedByAccessPattern } from "~/storage/accessPatterns/AppCreatedByAccessPattern.js";
import { AppActionAccessPattern } from "~/storage/accessPatterns/AppActionAccessPattern.js";
import { AppCreatedByActionAccessPattern } from "~/storage/accessPatterns/AppCreatedByActionAccessPattern.js";
import { AppEntityAccessPattern } from "~/storage/accessPatterns/AppEntityAccessPattern.js";
import { AppEntityActionAccessPattern } from "~/storage/accessPatterns/AppEntityActionAccessPattern.js";
import { EntityIdGlobalAccessPattern } from "~/storage/accessPatterns/EntityIdAccessPattern.js";
import { ActionAccessPattern } from "~/storage/accessPatterns/ActionAccessPattern.js";
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
        new AppCreatedByAccessPattern({
            entity,
            index: "GSI2"
        }),
        new AppEntityAccessPattern({
            entity,
            index: "GSI3"
        }),
        new EntityIdGlobalAccessPattern({
            entity,
            index: "GSI4"
        }),
        new ActionAccessPattern({
            entity,
            index: "GSI5"
        }),
        new AppActionAccessPattern({
            entity,
            index: "GSI6"
        }),
        new AppEntityActionAccessPattern({
            entity,
            index: "GSI7"
        }),
        new AppCreatedByActionAccessPattern({
            entity,
            index: "GSI8"
        }),
        new CreatedByAccessPattern({
            entity,
            index: "GSI9"
        }),
        new CreatedOnAccessPattern({
            entity,
            index: "GSI10"
        })
    ];
};
