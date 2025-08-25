import type { IConverter } from "~/storage/abstractions/IConverter.js";
import type { ICompressor } from "@webiny/utils/compression/index.js";
import type { IAuditLog, IStorageItem } from "~/storage/types.js";

export class Converter implements IConverter {
    private readonly compressor;

    public constructor(compressor: ICompressor) {
        this.compressor = compressor;
    }

    public async oneFromStorage(input: IStorageItem): Promise<IAuditLog> {
        return {
            ...input.data,
            content: await this.compressor.decompress(JSON.parse(input.data.content)),
            createdOn: new Date(input.data.createdOn)
        };
    }

    public async listFromStorage(items: IStorageItem[]): Promise<IAuditLog[]> {
        return await Promise.all(
            items.map(async item => {
                return await this.oneFromStorage(item);
            })
        );
    }

    public async oneToStorage(auditLog: IAuditLog): Promise<IStorageItem> {
        const time = auditLog.createdOn.getTime();

        return {
            PK: `T#${auditLog.tenant}#AUDIT_LOG`,
            SK: `${auditLog.id}`,
            // By App Type
            GSI1_PK: `T#${auditLog.tenant}#AUDIT_LOG#APP#${auditLog.app}`,
            GSI1_SK: time,
            // By App And Action
            GSI2_PK: `T#${auditLog.tenant}#AUDIT_LOG#APP#${auditLog.app}#ACTION#${auditLog.action}`,
            GSI2_SK: time,
            // By User
            GSI3_PK: `T#${auditLog.tenant}#AUDIT_LOG#USER#${auditLog.createdBy.id}`,
            GSI3_SK: time,
            // By Time
            GSI4_PK: `T#${auditLog.tenant}#AUDIT_LOG#TIME`,
            GSI4_SK: time,
            // By App And Target
            GSI5_PK: `T#${auditLog.tenant}#AUDIT_LOG#APP#${auditLog.app}#TARGET`,
            GSI5_SK: auditLog.targetId,
            data: {
                ...auditLog,
                content: JSON.stringify(await this.compressor.compress(auditLog.content)),
                createdOn: auditLog.createdOn.toISOString()
            }
        };
    }
}
