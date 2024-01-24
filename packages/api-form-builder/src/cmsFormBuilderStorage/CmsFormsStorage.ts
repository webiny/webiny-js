import { CmsEntry, CmsModel, HeadlessCms } from "@webiny/api-headless-cms/types";
import WebinyError from "@webiny/error";
import { Security } from "@webiny/api-security/types";
import { createIdentifier, parseIdentifier } from "@webiny/utils";

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
        const formId = initialFormId || parseIdentifier(id).id;

        const entry = await this.security.withoutAuthorization(async () => {
            if (latest) {
                const entry = await this.cms.getEntry(model, {
                    where: { entryId: formId, latest: true }
                });

                return entry;
            } else if (published && !version) {
                const [entry] = await this.cms.getPublishedEntriesByIds(model, [formId]);

                return entry;
            } else if (id || version) {
                const fallbackId = createIdentifier({
                    id: formId,
                    version: version || 1
                });

                return await this.cms.getEntryById(model, id || fallbackId);
            } else if (latest && published) {
                throw new WebinyError("Cannot have both latest and published params.");
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
            return await this.cms.createEntryRevisionFrom(model, form.id, {});
        });

        return this.getFormFieldValues(entry);
    }

    async updateForm(params: FormBuilderStorageOperationsUpdateFormParams): Promise<FbForm> {
        const { form } = params;
        const model = this.modelWithContext(form);

        const entry = await this.security.withoutAuthorization(async () => {
            return await this.cms.updateEntry(model, form.id, form);
        });

        return this.getFormFieldValues(entry);
    }

    async deleteForm(params: FormBuilderStorageOperationsDeleteFormParams): Promise<void> {
        const { form } = params;
        const model = this.modelWithContext(form);

        await this.security.withoutAuthorization(async () => {
            return await this.cms.deleteEntry(model, form.id);
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
        const { tenant, locale, ...restWhere } = params.where;
        const model = this.modelWithContext({ tenant, locale });

        const [entries, meta] = await this.security.withoutAuthorization(async () => {
            return await this.cms.listLatestEntries(model, {
                after: params.after,
                limit: params.limit,
                sort: params.sort,
                where: restWhere
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
        const { form } = params;
        const model = this.modelWithContext(form);

        const entry = await this.security.withoutAuthorization(async () => {
            return await this.cms.publishEntry(model, form.id);
        });

        return this.getFormFieldValues(entry);
    }

    async unpublishForm(params: FormBuilderStorageOperationsUnpublishFormParams): Promise<FbForm> {
        const { form } = params;
        const model = this.modelWithContext(form);

        const entry = await this.security.withoutAuthorization(async () => {
            return await this.cms.unpublishEntry(model, form.id);
        });

        return this.getFormFieldValues(entry);
    }

    private getFormFieldValues(entry: CmsEntry) {
        return {
            id: entry.id,
            createdBy: entry.createdBy,
            createdOn: entry.createdOn,
            savedOn: entry.savedOn,
            publishedOn: entry.lastPublishedOn,
            status: entry.status,
            locale: entry.locale,
            tenant: entry.tenant,
            webinyVersion: entry.webinyVersion,
            version: entry.version,
            ...entry.values
        } as FbForm;
    }
}
