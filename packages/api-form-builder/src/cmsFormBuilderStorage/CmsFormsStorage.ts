import { CmsEntry, CmsModel, HeadlessCms } from "@webiny/api-headless-cms/types";
import WebinyError from "@webiny/error";
import { Security } from "@webiny/api-security/types";
import { createIdentifier } from "@webiny/utils";

import {
    FbForm,
    FormBuilderStorageOperationsListFormsParams,
    FormBuilderStorageOperationsListFormRevisionsParams,
    FormBuilderStorageOperationsUpdateFormParams,
    FormBuilderStorageOperationsDeleteFormRevisionParams,
    FormBuilderStorageOperationsPublishFormParams,
    FormBuilderStorageOperationsUnpublishFormParams,
    FormBuilderStorageOperationsListFormsResponse,
    FormBuilderStorageOperationsCreateFormParams,
    FormBuilderStorageOperationsCreateFormFromParams,
    FormBuilderStorageOperationsDeleteFormParams,
    FormBuilderStorageOperationsGetFormParams,
    FormBuilderFormStorageOperations
} from "~/types";

interface ModelContext {
    tenant: string;
    locale: string;
}

export class CmsFormsStorage implements FormBuilderFormStorageOperations {
    private readonly cms: HeadlessCms;
    private readonly security: Security;
    private readonly model: CmsModel;

    static async create(params: { model: CmsModel; cms: HeadlessCms; security: Security }) {
        return new CmsFormsStorage(params.model, params.cms, params.security);
    }

    private constructor(model: CmsModel, cms: HeadlessCms, security: Security) {
        this.model = model;
        this.cms = cms;
        this.security = security;
    }

    private modelWithContext({ tenant, locale }: ModelContext): CmsModel {
        return { ...this.model, tenant, locale };
    }

    async getForm(params: FormBuilderStorageOperationsGetFormParams): Promise<FbForm | null> {
        const {
            id,
            formId: initialFormId,
            version,
            published,
            latest,
            tenant,
            locale
        } = params.where;
        const model = this.modelWithContext({ tenant, locale });
        const formId = initialFormId || id?.split("#").shift() || "";

        const entry = await this.security.withoutAuthorization(async () => {
            if (latest) {
                const [entries] = await this.cms.listLatestEntries(model, {
                    where: { entryId: formId }
                });

                return entries[0];
            } else if (published && !version) {
                const entries = (await this.cms.getEntryRevisions(model, formId))
                    .filter(entryItem => entryItem.values.published)
                    .sort((a, b) => b.version - a.version);

                return entries[0];
            } else if (id || version) {
                return await this.cms.getEntryById(
                    model,
                    id ||
                        createIdentifier({
                            id: formId as string,
                            version: version as number
                        })
                );
            } else {
                throw new WebinyError("Missing parameter to get form", "MISSING_WHERE_PARAMETER", {
                    where: params.where
                });
            }
        });

        return entry ? this.getFormFieldValues(entry) : null;
    }

    async createForm(params: FormBuilderStorageOperationsCreateFormParams): Promise<FbForm> {
        const { form } = params;
        const model = this.modelWithContext(form);

        const entry = await this.security.withoutAuthorization(() => {
            return this.cms.createEntry(model, { ...form });
        });

        return this.getFormFieldValues(entry);
    }

    async createFormFrom(
        params: FormBuilderStorageOperationsCreateFormFromParams
    ): Promise<FbForm> {
        const { form } = params;
        const model = this.modelWithContext(form);

        const entry = await this.security.withoutAuthorization(async () => {
            return await this.cms.createEntryRevisionFrom(model, form.id, {
                status: "draft",
                published: false,
                locked: false,
                stats: {
                    submissions: 0,
                    views: 0
                }
            });
        });

        return this.getFormFieldValues(entry);
    }

    async updateForm(params: FormBuilderStorageOperationsUpdateFormParams): Promise<FbForm> {
        const { form, input, meta, options } = params;
        const model = this.modelWithContext(form);

        const entry = await this.security.withoutAuthorization(async () => {
            return await this.cms.updateEntry(model, form.id, input, meta, options);
        });

        return this.getFormFieldValues(entry);
    }

    async deleteForm(params: FormBuilderStorageOperationsDeleteFormParams): Promise<void> {
        const { form } = params;
        const model = this.modelWithContext(form);

        await this.security.withoutAuthorization(async () => {
            return await this.cms.deleteEntry(model, form.id, {
                force: true
            });
        });
    }

    async deleteFormRevision(
        params: FormBuilderStorageOperationsDeleteFormRevisionParams
    ): Promise<void> {
        const { form } = params;
        const model = this.modelWithContext(form);

        await this.security.withoutAuthorization(async () => {
            return await this.cms.deleteEntryRevision(model, form.id);
        });
    }

    async listForms(
        params: FormBuilderStorageOperationsListFormsParams
    ): Promise<FormBuilderStorageOperationsListFormsResponse> {
        const { id, tenant, locale, ...restWhere } = params.where;
        const model = this.modelWithContext({ tenant, locale });

        const [entries, meta] = await this.security.withoutAuthorization(async () => {
            return await this.cms.listLatestEntries(model, {
                after: params.after,
                limit: params.limit,
                sort: params.sort,
                where: { entryId: id, ...restWhere }
            });
        });

        return [entries.map(entry => this.getFormFieldValues(entry)), meta];
    }

    async listFormRevisions(
        params: FormBuilderStorageOperationsListFormRevisionsParams
    ): Promise<FbForm[]> {
        const { tenant, locale, formId } = params.where;
        const model = this.modelWithContext({ tenant, locale });

        const entries = await this.security.withoutAuthorization(async () => {
            return await this.cms.getEntryRevisions(model, formId);
        });

        return entries.map(entry => this.getFormFieldValues(entry));
    }

    async publishForm(params: FormBuilderStorageOperationsPublishFormParams): Promise<FbForm> {
        const { form, input } = params;
        const model = this.modelWithContext(form);

        const entry = await this.security.withoutAuthorization(async () => {
            return await this.cms.updateEntry(model, form.id, input);
        });

        return this.getFormFieldValues(entry);
    }

    async unpublishForm(params: FormBuilderStorageOperationsUnpublishFormParams): Promise<FbForm> {
        const { form, input } = params;
        const model = this.modelWithContext(form);

        const entry = await this.security.withoutAuthorization(async () => {
            return await this.cms.updateEntry(model, form.id, input);
        });

        return this.getFormFieldValues(entry);
    }

    private getFormFieldValues(entry: CmsEntry) {
        return {
            id: entry.id,
            createdBy: entry.createdBy,
            createdOn: entry.createdOn,
            savedOn: entry.savedOn,
            locale: entry.locale,
            tenant: entry.tenant,
            webinyVersion: entry.webinyVersion,
            version: entry.version,
            ...entry.values
        } as FbForm;
    }
}
