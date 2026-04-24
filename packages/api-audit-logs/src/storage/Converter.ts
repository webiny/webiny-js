import type { IConverter } from "~/storage/abstractions/Converter.js";
import type { IAuditLog, IStorageItem } from "~/storage/types.js";
import type { IAccessPatternHandler } from "~/storage/abstractions/AccessPatternHandler.js";
import { convertExpiresAtToUnixTimestamp } from "~/utils/expiresAt.js";
import { CompressionHandler } from "@webiny/utils/exports/api.js";

const convertToDateTime = (value: string): Date => {
    return new Date(value);
};

export interface IConverterParams {
    compressionHandler: CompressionHandler.Interface;
    patternHandler: IAccessPatternHandler;
}

type PickOnlyGSIKeys<T> = {
    [K in keyof T]: K extends `GSI${string}` ? K : never;
}[keyof T];

type PickedGSIKeys = Pick<IStorageItem, PickOnlyGSIKeys<IStorageItem>>;

export class Converter implements IConverter {
    private readonly compressionHandler;
    private readonly patternHandler;

    public constructor(params: IConverterParams) {
        this.compressionHandler = params.compressionHandler;
        this.patternHandler = params.patternHandler;
    }

    public async oneFromStorage(item: IStorageItem): Promise<IAuditLog> {
        return {
            ...item.data,
            expiresAt: convertToDateTime(item.data.expiresAt),
            content: await this.compressionHandler.decompress(JSON.parse(item.data.content)),
            createdOn: new Date(item.data.createdOn)
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
            const patternKeys = pattern.createKeys(auditLog);
            return {
                ...output,
                [`${pattern.index}_PK`]: patternKeys.partitionKey,
                [`${pattern.index}_SK`]: patternKeys.sortKey
            };
        }, {} as PickedGSIKeys);

        return {
            PK: defaultKeys.partitionKey,
            SK: defaultKeys.sortKey as unknown as string,
            ...keys,
            TYPE: "auditLog.log",
            GSI_TENANT: auditLog.tenant,
            data: {
                ...auditLog,
                expiresAt: auditLog.expiresAt.toISOString(),
                content: JSON.stringify(await this.compressionHandler.compress(auditLog.content)),
                createdOn: auditLog.createdOn.toISOString()
            },
            expiresAt: convertExpiresAtToUnixTimestamp(auditLog.expiresAt)
        };
    }
}
