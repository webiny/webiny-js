import { apps } from "@webiny/common-audit-logs/index.js";
import type { IAuditLog, IAuditLogRaw } from "~/types.js";

export interface ITransformRawAuditLogParams {
    auditLog: IAuditLogRaw;
}

export const transformRawAuditLog = (params: ITransformRawAuditLogParams): IAuditLog => {
    const { auditLog } = params;

    const app = apps.find(app => app.app === auditLog.app);
    const entity = app?.entities?.find(entity => entity.type === auditLog.entity);
    const action = entity?.actions?.find(action => action.type === auditLog.action);
    return {
        ...auditLog,
        createdBy: {
            ...auditLog.createdBy,
            // TODO load users?
            role: "-"
        },
        action: {
            label: action?.displayName || "-",
            value: auditLog.action
        },
        entity: {
            label: entity?.displayName || "-",
            value: auditLog.entity,
            link: entity?.linkToEntity && entity.linkToEntity(encodeURIComponent(auditLog.entityId))
        }
    };
};
