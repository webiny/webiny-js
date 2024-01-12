import omit from "lodash/omit";
import { CmsEntry, CmsModel, HeadlessCms } from "@webiny/api-headless-cms/types";
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
    FileManagerFilesStorageOperationsListResponse,
    FileManagerFilesStorageOperationsTagsParams,
    FileManagerFilesStorageOperationsTagsResponse,
    FileManagerFilesStorageOperationsUpdateParams
} from "~/types";
import { ListFilesWhereProcessor } from "~/cmsFileStorage/ListFilesWhereProcessor";
import { ListTagsWhereProcessor } from "~/cmsFileStorage/ListTagsWhereProcessor";
import { ROOT_FOLDER } from "~/contants";

interface ModelContext {
    tenant: string;
    locale: string;
}

export class CmsFilesStorage implements FileManagerFilesStorageOperations {
    private readonly cms: HeadlessCms;
    private readonly security: Security;
    private readonly model: CmsModel;
    private readonly aliases: FileManagerAliasesStorageOperations;
    private readonly filesWhereProcessor: ListFilesWhereProcessor;
    private readonly tagsWhereProcessor: ListTagsWhereProcessor;

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
        this.filesWhereProcessor = new ListFilesWhereProcessor();
        this.tagsWhereProcessor = new ListTagsWhereProcessor();
    }

    private modelWithContext({ tenant, locale }: ModelContext): CmsModel {
        return { ...this.model, tenant, locale };
    }

    async create({ file }: FileManagerFilesStorageOperationsCreateParams): Promise<File> {
        const model = this.modelWithContext(file);

        if (!file.location?.folderId) {
            file.location = {
                ...file.location,
                folderId: ROOT_FOLDER
            };
        }

        const entry = await this.security.withoutAuthorization(() => {
            return this.cms.createEntry(model, {
                ...file,
                wbyAco_location: file.location
            });
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
            const where = this.filesWhereProcessor.process(params.where);
            return this.cms.listLatestEntries(model, {
                after: params.after,
                limit: params.limit,
                sort: params.sort,
                where,
                search: params.search
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
                    ...this.tagsWhereProcessor.process(params.where),
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

            const values = omit(file, ["id", "tenant", "locale", "webinyVersion"]);

            const updatedEntry = await this.cms.updateEntry(model, entry.id, {
                ...values,
                wbyAco_location: values.location ?? entry.location
            });

            await this.aliases.storeAliases(file);

            return this.getFileFieldValues(updatedEntry);
        });
    }

    private getFileFieldValues(entry: CmsEntry) {
        return {
            id: entry.entryId,

            // We're safe to use entry-level meta fields because we don't use revisions with files.
            createdBy: entry.createdBy,
            modifiedBy: entry.modifiedBy || null,
            savedBy: entry.savedBy,
            createdOn: entry.createdOn,
            modifiedOn: entry.modifiedOn || null,
            savedOn: entry.savedOn,

            locale: entry.locale,
            tenant: entry.tenant,
            webinyVersion: entry.webinyVersion,
            ...entry.values
        } as File;
    }
}
