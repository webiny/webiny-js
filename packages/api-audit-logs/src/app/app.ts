import { IAcoAppRegisterParams, SearchRecord } from "@webiny/api-aco/types";
import { AUDIT_LOGS_TYPE } from "./contants";
import { compressor } from "~/utils/compressor";
import { NotAuthorizedError } from "@webiny/api-security";

const toDate = (value: string | Date) => {
    if (value instanceof Date) {
        return value;
    }
    try {
        return new Date(value);
    } catch {
        return value;
    }
};

const decompressData = (entry: SearchRecord<any>): SearchRecord<any> => {
    if (!entry.data?.data) {
        return entry;
    }
    return {
        ...entry,
        data: {
            ...entry.data,
            timestamp: toDate(entry.data.timestamp),
            data: compressor.decompress(entry.data.data)
        }
    };
};

export const createApp = (): IAcoAppRegisterParams => {
    return {
        name: AUDIT_LOGS_TYPE,
        apiName: "AuditLogs",
        fields: [
            {
                id: "id",
                fieldId: "id",
                type: "text",
                storageId: "text@id",
                label: "ID"
            },
            {
                id: "message",
                fieldId: "message",
                type: "text",
                storageId: "text@message",
                label: "Message"
            },
            {
                id: "app",
                fieldId: "app",
                type: "text",
                storageId: "text@app",
                label: "App"
            },
            {
                id: "entity",
                fieldId: "entity",
                type: "text",
                storageId: "text@entity",
                label: "Entity"
            },
            {
                id: "entityId",
                fieldId: "entityId",
                type: "text",
                storageId: "text@entityId",
                label: "Entity ID"
            },
            {
                id: "action",
                fieldId: "action",
                type: "text",
                storageId: "text@action",
                label: "Action"
            },
            {
                id: "data",
                fieldId: "data",
                type: "text",
                storageId: "text@data",
                label: "Data"
            },
            {
                id: "timestamp",
                fieldId: "timestamp",
                type: "datetime",
                settings: {
                    type: "dateTimeWithoutTimezone"
                },
                storageId: "datetime@timestamp",
                label: "Timestamp"
            },
            {
                id: "initiator",
                fieldId: "initiator",
                type: "text",
                storageId: "text@initiator",
                label: "Initiator"
            }
        ],
        onEntry: async entry => {
            return decompressData(entry);
        },
        onEntryList: async entries => {
            return Promise.all(
                entries.map(entry => {
                    return decompressData(entry);
                })
            );
        },
        onAnyRequest: async (context, action) => {
            const permissions = await context.security.getPermissions("al.*");
            for (const permission of permissions) {
                if (permission.name === "al.*") {
                    return;
                } else if (permission.name === `al.${action}`) {
                    return;
                }
            }

            throw new NotAuthorizedError({
                message: "You cannot access audit logs."
            });
        }
    };
};
