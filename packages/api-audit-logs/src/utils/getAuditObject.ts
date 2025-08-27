import type { ActionObject, AuditObject, EntityObject } from "~/types";
import type { App } from "@webiny/common-audit-logs/types.js";

export const getAuditObject = (apps: App[]) => {
    return apps.reduce<AuditObject>((result, app) => {
        result[app.app] = app.entities.reduce<EntityObject>((entities, entity) => {
            entities[entity.type] = entity.actions.reduce<ActionObject>((actions, action) => {
                actions[action.type] = {
                    app,
                    entity,
                    action
                };

                return actions;
            }, {});

            return entities;
        }, {});

        return result;
    }, {});
};
