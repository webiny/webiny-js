import type { AcoContext, IAcoAppRegisterParams, SearchRecord } from "@webiny/api-aco/types";
import { AUDIT_LOGS_TYPE } from "./contants";
import { NotAuthorizedError } from "@webiny/api-security";
import type { Topic } from "@webiny/pubsub/types.js";
import type {
    OnAuditLogBeforeCreateTopicParams,
    OnAuditLogBeforeDeleteTopicParams,
    OnAuditLogBeforeUpdateTopicParams
} from "./types.js";
import type { AuditLogValues } from "~/types.js";

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

const decompressData = async (
    entry: SearchRecord<any>,
    context: Pick<AcoContext, "compressor">
): Promise<SearchRecord<any>> => {
    if (!entry.data?.data) {
        return entry;
    }

    return {
        ...entry,
        data: {
            ...entry.data,
            timestamp: toDate(entry.data.timestamp),
            data: await context.compressor.decompress(JSON.parse(entry.data.data))
        }
    };
};

export interface ICreateAppParams {
    onBeforeCreate: Topic<OnAuditLogBeforeCreateTopicParams>;
    onBeforeUpdate: Topic<OnAuditLogBeforeUpdateTopicParams>;
    onBeforeDelete: Topic<OnAuditLogBeforeDeleteTopicParams>;
}

const createValuesSetter = (input: AuditLogValues) => {
    return (values: Partial<AuditLogValues>): AuditLogValues => {
        return {
            ...input,
            ...values
        };
    };
};

export const createApp = (params: ICreateAppParams): IAcoAppRegisterParams => {
    const { onBeforeCreate, onBeforeUpdate, onBeforeDelete } = params;
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
        onBeforeCreate: async params => {
            const values = params.input as unknown as AuditLogValues;
            const setValues = createValuesSetter(values);

            await onBeforeCreate.publish({
                context: params.context,
                values,
                setValues
            });
        },
        onBeforeUpdate: async params => {
            const values = params.input as unknown as AuditLogValues;
            const setValues = createValuesSetter(values);

            await onBeforeUpdate.publish({
                context: params.context,
                original: params.original as unknown as AuditLogValues,
                values,
                setValues
            });
        },
        onBeforeDelete: async params => {
            await onBeforeDelete.publish({
                id: params.id,
                context: params.context,
                original: params.original as unknown as AuditLogValues
            });
        },
        onEntry: async (entry, context) => {
            return decompressData(entry, context);
        },
        onEntryList: async (entries, context) => {
            return await Promise.all(
                entries.map(async entry => {
                    return decompressData(entry, context);
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
