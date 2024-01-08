import { CmsEntry, CmsModel, HeadlessCms } from "@webiny/api-headless-cms/types";
import { Security } from "@webiny/api-security/types";
import { createIdentifier } from "@webiny/utils";

import {
    FormBuilderStorageOperationsGetFormStatsParams,
    FormBuilderStorageOperationsListFormStatsParams,
    FormBuilderStorageOperationsCreateFormStatsParams,
    FormBuilderStorageOperationsUpdateFormStatsParams,
    FormBuilderStorageOperationsDeleteFormStatsParams,
    FormBuilderFormStatsStorageOperations,
    FbFormStats
} from "~/types";

interface ModelContext {
    tenant: string;
    locale: string;
}

export class CmsFormStatsStorage implements FormBuilderFormStatsStorageOperations {
    private readonly cms: HeadlessCms;
    private readonly security: Security;
    private readonly model: CmsModel;

    static async create(params: { model: CmsModel; cms: HeadlessCms; security: Security }) {
        return new CmsFormStatsStorage(params.model, params.cms, params.security);
    }

    private constructor(model: CmsModel, cms: HeadlessCms, security: Security) {
        this.model = model;
        this.cms = cms;
        this.security = security;
    }

    private modelWithContext({ tenant, locale }: ModelContext): CmsModel {
        return { ...this.model, tenant, locale };
    }

    async getFormStats(params: FormBuilderStorageOperationsGetFormStatsParams) {
        const { id, tenant, locale } = params.where;
        const model = this.modelWithContext({ tenant, locale });

        const entry = await this.security.withoutAuthorization(() => {
            return this.cms.getEntry(model, {
                where: { entryId: id, latest: true }
            });
        });

        return this.getFormStatsValues(entry);
    }

    async listFormStats(params: FormBuilderStorageOperationsListFormStatsParams) {
        const { tenant, locale, ...restWhere } = params.where;
        const model = this.modelWithContext({ tenant, locale });

        const [entries] = await this.security.withoutAuthorization(() => {
            return this.cms.listEntries(model, {
                where: { ...restWhere, latest: true }
            });
        });

        return entries.map(entry => this.getFormStatsValues(entry));
    }

    async createFormStats({ formStats }: FormBuilderStorageOperationsCreateFormStatsParams) {
        const model = this.modelWithContext(formStats);

        const entry = await this.security.withoutAuthorization(() => {
            return this.cms.createEntry(model, formStats);
        });

        return this.getFormStatsValues(entry);
    }

    async updateFormStats({ formStats }: FormBuilderStorageOperationsUpdateFormStatsParams) {
        const model = this.modelWithContext(formStats);

        // The version is set to 1, as `formStats` always has only one revision.
        const formStatsRevisionId = createIdentifier({
            id: formStats.id,
            version: 1
        });

        const entry = await this.security.withoutAuthorization(() => {
            return this.cms.updateEntry(model, formStatsRevisionId, formStats);
        });

        return this.getFormStatsValues(entry);
    }

    async deleteFormStats(params: FormBuilderStorageOperationsDeleteFormStatsParams) {
        const { ids, tenant, locale } = params;
        const model = this.modelWithContext({ tenant, locale });

        await this.security.withoutAuthorization(() => {
            return this.cms.deleteMultipleEntries(model, { entries: ids });
        });
    }

    private getFormStatsValues(entry: CmsEntry) {
        return {
            id: entry.entryId,
            locale: entry.locale,
            tenant: entry.tenant,
            ...entry.values
        } as FbFormStats;
    }
}
