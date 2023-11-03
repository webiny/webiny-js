import omit from "lodash/omit";

import { CmsEntry, CmsModel, HeadlessCms } from "@webiny/api-headless-cms/types";
import { Security } from "@webiny/api-security/types";

import {
    FormBuilderStorageOperationsCreateSubmissionParams,
    FormBuilderStorageOperationsUpdateSubmissionParams,
    FormBuilderStorageOperationsListSubmissionsParams
} from "~/types";

interface ModelContext {
    tenant: string;
    locale: string;
}

export class CmsSubmissionsStorage {
    private readonly cms: HeadlessCms;
    private readonly security: Security;
    private readonly model: CmsModel;

    static async create(params: { model: CmsModel; cms: HeadlessCms; security: Security }) {
        return new CmsSubmissionsStorage(params.model, params.cms, params.security);
    }

    private constructor(model: CmsModel, cms: HeadlessCms, security: Security) {
        this.model = model;
        this.cms = cms;
        this.security = security;
    }

    private modelWithContext({ tenant, locale }: ModelContext): CmsModel {
        return { ...this.model, tenant, locale };
    }

    listSubmissions = async (params: FormBuilderStorageOperationsListSubmissionsParams) => {
        const { id_in, formId, tenant, locale } = params.where;
        const model = this.modelWithContext({ tenant, locale });

        const [entries, meta] = await this.security.withoutAuthorization(async () => {
            return await this.cms.listLatestEntries(model, {
                after: params.after,
                limit: params.limit,
                sort: params.sort,
                where: {
                    entryId_in: id_in,
                    form: { parent: formId }
                }
            });
        });

        return { items: entries.map(entry => this.getSubmissionValues(entry)), meta };
    };

    createSubmission = async ({
        submission
    }: FormBuilderStorageOperationsCreateSubmissionParams) => {
        const model = this.modelWithContext(submission);

        const entry = await this.security.withoutAuthorization(() => {
            return this.cms.createEntry(model, { ...submission });
        });

        return this.getSubmissionValues(entry);
    };

    updateSubmission = async ({
        submission
    }: FormBuilderStorageOperationsUpdateSubmissionParams) => {
        const model = this.modelWithContext(submission);

        return await this.security.withoutAuthorization(async () => {
            const entry = await this.cms.getEntry(model, {
                where: { entryId: submission.id, latest: true }
            });

            const values = omit(submission, [
                "id",
                "createdOn",
                "createdBy",
                "tenant",
                "locale",
                "webinyVersion"
            ]);

            const updatedEntry = await this.cms.updateEntry(model, entry.id, values);

            return this.getSubmissionValues(updatedEntry);
        });
    };

    private getSubmissionValues(entry: CmsEntry) {
        return {
            id: entry.entryId,
            createdBy: entry.createdBy,
            createdOn: entry.createdOn,
            savedOn: entry.savedOn,
            locale: entry.locale,
            tenant: entry.tenant,
            webinyVersion: entry.webinyVersion,
            ...entry.values
        };
    }
}
