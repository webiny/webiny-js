import { CmsEntry, CmsModel, HeadlessCms } from "@webiny/api-headless-cms/types";
import { Security } from "@webiny/api-security/types";
import { FbForm, FormBuilderStorageOperationsListFormsParams } from "~/types";

interface ModelContext {
    tenant: string;
    locale: string;
}

export class CmsFormBuilderStorage {
    private readonly cms: HeadlessCms;
    private readonly security: Security;
    private readonly model: CmsModel;

    static async create(params: { formModel: CmsModel; cms: HeadlessCms; security: Security }) {
        return new CmsFormBuilderStorage(params.formModel, params.cms, params.security);
    }

    private constructor(formModel: CmsModel, cms: HeadlessCms, security: Security) {
        this.model = formModel;
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
        const entry = await this.security.withoutAuthorization(() => {
            return this.cms.getEntry(model, { where: { entryId: id, latest: true } });
        });
        return entry ? this.getFormFieldValues(entry) : null;
    };

    listFormRevisions = async (params: FormBuilderStorageOperationsListFormsParams) => {
        const {
            where: { tenant, locale, id }
        } = params;
        const model = this.modelWithContext({ tenant, locale });

        const [entries, meta] = await this.security.withoutAuthorization(async () => {
            return await this.cms.listLatestEntries(model, {
                after: params.after,
                limit: params.limit,
                sort: params.sort,
                where: {
                    entryId: id
                }
            });
        });

        return [entries.map(entry => this.getFormFieldValues(entry)), meta];
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

    private getFormFieldValues(entry: CmsEntry) {
        return {
            id: entry.entryId,
            createdBy: entry.createdBy,
            createdOn: entry.createdOn,
            savedOn: entry.savedOn,
            locale: entry.locale,
            tenant: entry.tenant,
            webinyVersion: entry.webinyVersion,
            ...entry.values
        } as FbForm;
    }
}
