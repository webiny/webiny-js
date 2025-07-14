import type {
    CmsModelField,
    CmsModelFieldToGraphQLPlugin,
    IFullTextSearchField,
    IFullTextSearchFields,
    IFullTextSearchFieldsFindCallable,
    IFullTextSearchFieldsMapCallable
} from "~/types";

export interface IFullTextSearchFieldsParams {
    allowedFields: string[];
    fields: CmsModelField[];
    plugins: Record<string, CmsModelFieldToGraphQLPlugin>;
}

export class FullTextSearchFields implements IFullTextSearchFields {
    private readonly allowedFields: string[] = [];
    private readonly fields: IFullTextSearchField[] = [];
    private readonly plugins: Record<string, CmsModelFieldToGraphQLPlugin>;

    public constructor(params: IFullTextSearchFieldsParams) {
        const { fields, plugins, allowedFields } = params;

        this.plugins = plugins;
        this.allowedFields = allowedFields;

        for (const field of fields) {
            this.add(field, null);
        }
    }

    public map<T>(cb: IFullTextSearchFieldsMapCallable<T>): T[] {
        return this.fields.map(cb);
    }

    public find(cb: IFullTextSearchFieldsFindCallable): IFullTextSearchField | undefined {
        return this.fields.find(cb);
    }

    public hasAny(): boolean {
        return this.fields.length > 0;
    }

    public hasFieldId(fieldId: string): boolean {
        return this.fields.some(field => {
            return field.field.fieldId === fieldId;
        });
    }

    public getByPath(path: string): IFullTextSearchField | undefined {
        return this.fields.find(field => {
            return path === field.path;
        });
    }

    public getByStoragePath(storagePath: string): IFullTextSearchField | undefined {
        return this.fields.find(field => {
            return storagePath === field.storagePath;
        });
    }

    public getAllPaths(): string[] {
        return this.fields.map(field => field.path);
    }

    public getAllStoragePaths(): string[] {
        return this.fields.map(field => field.storagePath);
    }

    private add(input: CmsModelField, parent: IFullTextSearchField | null): void {
        const plugin = this.plugins[input.type];
        if (!plugin) {
            return;
        }

        const { path, storagePath } = this.buildPaths(input, parent);
        /**
         * There is a possibility that the field is not allowed to be added to the full text search.
         * User controls the allowed fields if they want to.
         */
        if (this.allowedFields.length > 0 && !this.allowedFields.includes(path)) {
            return;
        }

        const field: IFullTextSearchField = {
            field: input,
            parent,
            path,
            storagePath
        };

        for (const child of input.settings?.fields || []) {
            this.add(child, field);
        }

        /**
         * We do not want to add a field which has a fullTextSearch set to false via the plugin.
         */
        if (plugin.fullTextSearch !== true) {
            return;
        }
        /**
         * Also, we do not want to add a field which has fullTextSearch disabled via the settings.
         */
        if (input.settings?.disableFullTextSearch === true) {
            return;
        }
        this.fields.push(field);
    }

    private buildPaths(input: CmsModelField, initialParent: IFullTextSearchField | null) {
        const paths = [input.fieldId];
        const storagePaths = [input.storageId];

        let parent: IFullTextSearchField | null = initialParent;
        while (parent) {
            paths.unshift(parent.field.fieldId);
            storagePaths.unshift(parent.field.storageId);
            parent = parent.parent;
        }

        return {
            path: paths.join("."),
            storagePath: storagePaths.join(".")
        };
    }
}
