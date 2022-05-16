import { CmsEntry, CmsEntryValues, CmsModel, CmsStorageEntry } from "~/types";

const properties: string[] = [
    "name",
    "modelId",
    "tenant",
    "locale",
    "group",
    "description",
    "createdOn",
    "savedOn",
    "createdBy",
    "fields",
    "layout",
    "lockedFields",
    "titleFieldId",
    "webinyVersion"
];

interface CmsModelProxyParams {
    model: CmsModel;
}
interface ToStoragePathsParams {
    entry: CmsEntry;
}
interface FromStoragePathsParams {
    entry: CmsStorageEntry;
}
export class CmsModelProxy {
    private aliasToFieldIdMap?: Record<string, string>;
    private fieldIdToAliasMap?: Record<string, string>;

    public get modelId(): string {
        return this.data.modelId;
    }

    public constructor({ model }: CmsModelProxyParams) {
        return new Proxy(model, {
            get: (obj: any, property: string) => {
                if (properties.includes(property) === false) {
                    return undefined;
                }
                return obj[property];
            },
            set: (obj, property: string, value) => {
                if (properties.includes(property) === false) {
                    return false;
                }
                obj[property] = value;
                return true;
            }
        });
    }

    public toObject(): CmsModel {
        const values = properties.reduce((collection, property) => {
            collection[property] = this[property];
            return collection;
        }, {});
    }

    public entryToStoragePaths(params: ToStoragePathsParams): CmsStorageEntry {
        const { entry } = params;
        return {
            ...entry,
            values: this.toStoragePaths(entry.values)
        };
    }

    public entryFromStoragePaths(params: FromStoragePathsParams): CmsEntry {
        const { entry } = params;
        return {
            ...entry,
            values: this.fromStoragePaths(entry.values)
        };
    }

    public toStoragePaths(values: CmsEntryValues): CmsEntryValues {
        return Object.keys(values).reduce<Record<string, any>>((collection, alias) => {
            const fieldId = this.getFieldId(alias);
            collection[fieldId] = values[alias];

            return collection;
        }, {});
    }

    public fromStoragePaths(values: CmsEntryValues): CmsEntryValues {
        return Object.keys(values).reduce<Record<string, any>>((collection, fieldId) => {
            const alias = this.getAlias(fieldId);
            collection[alias] = values[fieldId];

            return collection;
        }, {});
    }

    public getAlias(fieldId: string): string {
        const fieldIds = this.getFieldIdToAliasMap();
        return fieldIds[fieldId] || fieldId;
    }

    public getFieldId(alias: string): string {
        const aliases = this.getAliasToFieldIdMap();
        return aliases[alias] || alias;
    }

    private getAliasToFieldIdMap(): Record<string, string> {
        if (!this.aliasToFieldIdMap) {
            this.aliasToFieldIdMap = this.data.fields.reduce<Record<string, string>>(
                (collection, field) => {
                    collection[field.alias] = field.fieldId;
                    return collection;
                },
                {}
            );
        }

        return this.aliasToFieldIdMap;
    }

    private getFieldIdToAliasMap(): Record<string, string> {
        if (!this.fieldIdToAliasMap) {
            this.fieldIdToAliasMap = this.data.fields.reduce<Record<string, string>>(
                (collection, field) => {
                    collection[field.fieldId] = field.alias;
                    return collection;
                },
                {}
            );
        }
        return this.fieldIdToAliasMap;
    }
}
