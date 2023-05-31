import omit from "lodash/omit";
import { HeadlessCms, CmsModel, CmsEntry, CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { Security } from "@webiny/api-security/types";
import {
    File,
    FileManagerAliasesStorageOperations,
    FileManagerFilesStorageOperations,
    FileManagerFilesStorageOperationsCreateBatchParams,
    FileManagerFilesStorageOperationsCreateParams,
    FileManagerFilesStorageOperationsDeleteParams,
    FileManagerFilesStorageOperationsGetParams,
    FileManagerFilesStorageOperationsListParams,
    FileManagerFilesStorageOperationsListParamsWhere,
    FileManagerFilesStorageOperationsListResponse,
    FileManagerFilesStorageOperationsTagsParams,
    FileManagerFilesStorageOperationsTagsResponse,
    FileManagerFilesStorageOperationsUpdateParams
} from "~/types";

type StandardFileKey = keyof FileManagerFilesStorageOperationsListParamsWhere;
type CmsEntryListWhereKey = keyof CmsEntryListWhere;

interface ModelContext {
    tenant: string;
    locale: string;
}

export class CmsFilesStorage implements FileManagerFilesStorageOperations {
    private readonly cms: HeadlessCms;
    private readonly security: Security;
    private readonly model: CmsModel;
    private readonly aliases: FileManagerAliasesStorageOperations;

    static async create(params: {
        fileModel: CmsModel;
        cms: HeadlessCms;
        security: Security;
        aliases: FileManagerAliasesStorageOperations;
    }) {
        return new CmsFilesStorage(params.fileModel, params.cms, params.security, params.aliases);
    }

    private constructor(
        fileModel: CmsModel,
        cms: HeadlessCms,
        security: Security,
        aliases: FileManagerAliasesStorageOperations
    ) {
        this.model = fileModel;
        this.aliases = aliases;
        this.cms = cms;
        this.security = security;
    }

    private modelWithContext({ tenant, locale }: ModelContext): CmsModel {
        return { ...this.model, tenant, locale };
    }

    async create({ file }: FileManagerFilesStorageOperationsCreateParams): Promise<File> {
        const model = this.modelWithContext(file);

        const entry = await this.security.withoutAuthorization(() => {
            return this.cms.createEntry(model, file);
        });

        await this.aliases.storeAliases(file);

        return this.getFileFieldValues(entry);
    }

    async createBatch({
        files
    }: FileManagerFilesStorageOperationsCreateBatchParams): Promise<File[]> {
        return await Promise.all(
            files.map(file => {
                return this.create({ file });
            })
        );
    }

    async delete({ file }: FileManagerFilesStorageOperationsDeleteParams): Promise<void> {
        const model = this.modelWithContext(file);
        await this.security.withoutAuthorization(() => {
            return this.cms.deleteEntry(model, file.id);
        });

        await this.aliases.deleteAliases(file);
    }

    async get({ where }: FileManagerFilesStorageOperationsGetParams): Promise<File | null> {
        const { id, tenant, locale } = where;
        const model = this.modelWithContext({ tenant, locale });
        const entry = await this.security.withoutAuthorization(() => {
            return this.cms.getEntry(model, { where: { entryId: id, latest: true } });
        });
        return entry ? this.getFileFieldValues(entry) : null;
    }

    async list(
        params: FileManagerFilesStorageOperationsListParams
    ): Promise<FileManagerFilesStorageOperationsListResponse> {
        const tenant = params.where.tenant;
        const locale = params.where.locale;

        const model = this.modelWithContext({ tenant, locale });
        const [entries, meta] = await this.security.withoutAuthorization(() => {
            return this.cms.listLatestEntries(model, {
                after: params.after,
                limit: params.limit,
                sort: params.sort,
                where: this.processWhereInput(params.where)
            });
        });

        return [entries.map(entry => this.getFileFieldValues(entry)), meta];
    }

    async tags(
        params: FileManagerFilesStorageOperationsTagsParams
    ): Promise<FileManagerFilesStorageOperationsTagsResponse[]> {
        const tenant = params.where.tenant;
        const locale = params.where.locale;
        const model = this.modelWithContext({ tenant, locale });
        const uniqueValues = await this.security.withoutAuthorization(() => {
            return this.cms.getUniqueFieldValues(model, {
                fieldId: "tags",
                where: {
                    ...this.processWhereInput(params.where),
                    latest: true
                }
            });
        });

        return uniqueValues
            .map(uv => ({
                tag: uv.value,
                count: uv.count
            }))
            .sort((a, b) => {
                return a.tag < b.tag ? -1 : 1;
            })
            .sort((a, b) => {
                return a.count > b.count ? -1 : 1;
            });
    }

    async update({ file }: FileManagerFilesStorageOperationsUpdateParams): Promise<File> {
        const model = this.modelWithContext(file);

        return await this.security.withoutAuthorization(async () => {
            const entry = await this.cms.getEntry(model, {
                where: { entryId: file.id, latest: true }
            });

            const values = omit(file, [
                "id",
                "createdOn",
                "createdBy",
                "tenant",
                "locale",
                "webinyVersion"
            ]);

            const updatedEntry = await this.cms.updateEntry(model, entry.id, values);

            await this.aliases.storeAliases(file);

            return this.getFileFieldValues(updatedEntry);
        });
    }

    private processWhereInput(
        input: FileManagerFilesStorageOperationsListParamsWhere
    ): CmsEntryListWhere {
        const where: CmsEntryListWhere = {};

        const keyMap: Partial<Record<StandardFileKey, CmsEntryListWhereKey>> = {
            createdBy: "createdBy",
            id: "entryId",
            id_in: "entryId_in",
            name: "name",
            name_contains: "name_contains",
            tag: "tags_in",
            tag_contains: "tags_contains",
            tag_not_startsWith: "tags_not_startsWith",
            tag_startsWith: "tags_startsWith",
            tag_and_in: "tags_and_in",
            tag_in: "tags_in",
            type: "type",
            type_in: "type_in",
            extensions: "extensions"
        };

        (Object.keys(keyMap) as Array<StandardFileKey>).forEach(key => {
            const cmsKey = keyMap[key];
            if (cmsKey) {
                where[cmsKey] = input[key];
            }
        });

        if (input.private) {
            where.meta = { private: true };
        } else {
            where.meta = { private_not: true };
        }

        if (input.search) {
            where.OR = [
                {
                    name_contains: input.search
                },
                {
                    tags_contains: input.search
                }
            ];
        }

        return where;
    }

    private getFileFieldValues(entry: CmsEntry) {
        return {
            id: entry.entryId,
            createdBy: entry.createdBy,
            createdOn: entry.createdOn,
            locale: entry.locale,
            tenant: entry.tenant,
            webinyVersion: entry.webinyVersion,
            ...entry.values
        } as File;
    }
}
