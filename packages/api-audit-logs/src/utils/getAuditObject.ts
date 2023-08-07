import { App, Entity, Action } from "~/types";

export type AuditAction = {
    app: App;
    entity: Entity;
    action: Action;
};

export const getAuditObject = (apps: App[]) => {
    const obj: Record<string, Record<string, Record<string, AuditAction>>> = {};

    apps.forEach(app => {
        const entitiesObj: Record<string, Record<string, AuditAction>> = {};

        app.entities.forEach(entity => {
            const actionsObj: Record<string, AuditAction> = {};

            entity.actions.forEach(action => {
                actionsObj[action.type] = { app, entity, action };
            });

            entitiesObj[entity.type] = actionsObj;
        });

        obj[app.app] = entitiesObj;
    });

    return obj;
};
