import { SearchRecordItem } from "@webiny/app-aco/types";
import { auditLogsApps } from "@webiny/api-audit-logs/config";

import { AuditLog, User } from "~/types";

export type Entry = {
    id: string;
    message: string;
    app: string;
    entity: {
        value: string;
        label: string;
        link?: string;
    };
    entityId: string;
    action: {
        label: string;
        value: string;
    };
    data: string;
    savedOn: Date;
    initiator: {
        id: string;
        name: string;
        role: string;
    };
};

export const transformCmsContentEntriesToRecordEntries = (
    items: SearchRecordItem<AuditLog>[],
    users: User[]
): Entry[] => {
    return items.map(({ id, data }) => {
        const app = auditLogsApps.find(app => app.app === data.app);
        const entity = app?.entities?.find(entity => entity.type === data.entity);
        const action = entity?.actions?.find(action => action.type === data.action);
        const user = users.find(user => user.id === data.initiator);

        return {
            id,
            message: data.message,
            app: app?.displayName || "-",
            entity: {
                label: entity?.displayName || "-",
                value: data.entity,
                link: entity?.linkToEntity && entity.linkToEntity(encodeURIComponent(data.entityId))
            },
            entityId: data.entityId,
            action: {
                label: action?.displayName || "-",
                value: data.action
            },
            data: data.data,
            savedOn: data.timestamp,
            initiator: {
                id: data.initiator,
                name: `${user?.firstName} ${user?.lastName}`,
                role: user?.group?.name || ""
            }
        };
    });
};
