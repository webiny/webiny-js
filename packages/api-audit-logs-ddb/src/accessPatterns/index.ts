import type { IAccessPattern } from "~/abstractions/AccessPattern.js";
import { DefaultAccessPattern } from "~/accessPatterns/DefaultAccessPattern.js";
import { AppAccessPattern } from "~/accessPatterns/AppAccessPattern.js";
import { AppCreatedByAccessPattern } from "~/accessPatterns/AppCreatedByAccessPattern.js";
import { AppEntityActionCreatedByAccessPattern } from "~/accessPatterns/AppEntityActionCreatedByAccessPattern.js";
import { AppEntityCreatedByAccessPattern } from "~/accessPatterns/AppEntityCreatedByAccessPattern.js";
import { AppEntityAccessPattern } from "~/accessPatterns/AppEntityAccessPattern.js";
import { AppEntityActionAccessPattern } from "~/accessPatterns/AppEntityActionAccessPattern.js";
import { EntityIdGlobalAccessPattern } from "~/accessPatterns/EntityIdAccessPattern.js";
import { CreatedByAccessPattern } from "~/accessPatterns/CreatedByAccessPattern.js";
import { CreatedOnAccessPattern } from "~/accessPatterns/CreatedOnAccessPattern.js";
import type { AuditLogsEntity } from "~/entity.js";

export interface ICreateAccessPatternsParams {
    entity: AuditLogsEntity;
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
        new AppEntityActionCreatedByAccessPattern({
            entity,
            index: "GSI5"
        }),
        new AppEntityActionAccessPattern({
            entity,
            index: "GSI6"
        }),
        new AppEntityCreatedByAccessPattern({
            entity,
            index: "GSI7"
        }),
        new CreatedByAccessPattern({
            entity,
            index: "GSI8"
        }),
        new CreatedOnAccessPattern({
            entity,
            index: "GSI9"
        })
    ];
};
