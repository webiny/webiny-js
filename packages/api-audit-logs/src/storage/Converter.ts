import type { IConverter } from "~/storage/abstractions/Converter.js";
import type { ICompressor } from "@webiny/utils/compression/index.js";
import type { IAuditLog, IStorageItem } from "~/storage/types.js";
import { createExpiresAt } from "./expiresAt";
import type { IAccessPatternHandler } from "~/storage/abstractions/AccessPatternHandler.js";

export interface IConverterParams {
    compressor: ICompressor;
    patternHandler: IAccessPatternHandler;
}

type PickOnlyGSIKeys<T> = {
    [K in keyof T]: K extends `GSI${string}` ? K : never;
}[keyof T];

type PickedGSIKeys = Pick<IStorageItem, PickOnlyGSIKeys<IStorageItem>>;

export class Converter implements IConverter {
    private readonly compressor;
    private readonly patternHandler;

    public constructor(params: IConverterParams) {
        this.compressor = params.compressor;
        this.patternHandler = params.patternHandler;
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
        const defaultPattern = this.patternHandler.getDefaultPattern();

        const defaultKeys = defaultPattern.createKeys(auditLog);

        const patterns = this.patternHandler.listIndexPatterns();

        const keys = patterns.reduce<PickedGSIKeys>((output, pattern) => {
            return {
                ...output,
                [`${pattern.index}_PK`]: defaultKeys.partitionKey,
                [`${pattern.index}_SK`]: defaultKeys.sortKey
            };
        }, {} as PickedGSIKeys);

        return {
            PK: defaultKeys.partitionKey,
            SK: defaultKeys.sortKey as unknown as string,
            ...keys,
            // By App Type
            // GSI1_PK: `T#${auditLog.tenant}#AUDIT_LOG#APP#${auditLog.app}`,
            // GSI1_SK: time,
            // // By App And Action
            // GSI2_PK: `T#${auditLog.tenant}#AUDIT_LOG#APP#${auditLog.app}#ACTION#${auditLog.action}`,
            // GSI2_SK: time,
            // // By User
            // GSI3_PK: `T#${auditLog.tenant}#AUDIT_LOG#USER#${auditLog.createdBy.id}`,
            // GSI3_SK: time,
            // // By Time
            // GSI4_PK: `T#${auditLog.tenant}#AUDIT_LOG#TIME`,
            // GSI4_SK: time,
            // // By App And Target
            // GSI5_PK: `T#${auditLog.tenant}#AUDIT_LOG#APP#${auditLog.app}#TARGET`,
            // GSI5_SK: auditLog.targetId,
            data: {
                ...auditLog,
                content: JSON.stringify(await this.compressor.compress(auditLog.content)),
                createdOn: auditLog.createdOn.toISOString()
            },
            expiresAt: createExpiresAt(auditLog.expiresAt)
        };
    }
}
