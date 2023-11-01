import { CmsEntry, CmsModel, HeadlessCms } from "@webiny/api-headless-cms/types";
import { Security } from "@webiny/api-security/types";
import {
    FbForm,
    FormBuilderStorageOperationsListFormsParams,
    FormBuilderStorageOperationsListFormRevisionsParams
} from "~/types";

interface ModelContext {
    tenant: string;
    locale: string;
}

export class CmsFormBuilderStorage {
    private readonly cms: HeadlessCms;
    private readonly security: Security;
    private readonly model: CmsModel;

    static async create(params: { model: CmsModel; cms: HeadlessCms; security: Security }) {
        return new CmsFormBuilderStorage(params.model, params.cms, params.security);
    }

    private constructor(model: CmsModel, cms: HeadlessCms, security: Security) {
        this.model = model;
        this.cms = cms;
        this.security = security;
    }

    private modelWithContext({ tenant, locale }: ModelContext): CmsModel {
        return { ...this.model, tenant, locale };
    }

    createForm = async ({ form }: { form: FbForm }) => {
        const model = this.modelWithContext(form);
        const entry = await this.security.withoutAuthorization(() => {
            return this.cms.createEntry(model, { ...form });
        });
        return this.getFormFieldValues(entry);
    };

    getForm = async ({ where }: FormBuilderStorageOperationsListFormsParams) => {
        const { id, tenant, locale } = where;
        const model = this.modelWithContext({ tenant, locale });
        const entry = await this.security.withoutAuthorization(async () => {
            return await this.cms.getEntryById(model, id || "");
        });
        return entry ? this.getFormFieldValues(entry) : null;
    };

    listFormRevisions = async (params: FormBuilderStorageOperationsListFormRevisionsParams) => {
        const {
            where: { tenant, locale, formId }
        } = params;
        const model = this.modelWithContext({ tenant, locale });
        const entries = await this.security.withoutAuthorization(async () => {
            return await this.cms.getEntryRevisions(model, `${formId}#0001`);
        });
        return [entries.map(entry => this.getFormFieldValues(entry))];
    };

    listForms = async (params: FormBuilderStorageOperationsListFormsParams) => {
        const tenant = params.where.tenant;
        const locale = params.where.locale;

        const model = this.modelWithContext({ tenant, locale });

        const [entries, meta] = await this.security.withoutAuthorization(async () => {
            return await this.cms.listLatestEntries(model, {
                after: params.after,
                limit: params.limit,
                sort: params.sort,
                where: {}
            });
        });

        return [entries.map(entry => this.getFormFieldValues(entry)), meta];
    };

    // [WIP]
    createFormFrom = async (params: any) => {
        const { form } = params;
        const model = this.modelWithContext(form);
        const entry = await this.security.withoutAuthorization(async () => {
            return await this.cms.createEntryRevisionFrom(model, form.id, {});
        });
        return entry ? this.getFormFieldValues(entry) : null;
    };

    deleteForm = async ({ form }: { form: FbForm }) => {
        const model = this.modelWithContext(form);

        await this.security.withoutAuthorization(async () => {
            return await this.cms.deleteEntry(model, form.id, {
                force: true
            });
        });
    };

    // [WIP]
    deleteFormRevision = async ({ form }: { form: FbForm }) => {
        const model = this.modelWithContext(form);

        await this.security.withoutAuthorization(async () => {
            return await this.cms.deleteEntryRevision(model, form.id);
        });
    };

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
