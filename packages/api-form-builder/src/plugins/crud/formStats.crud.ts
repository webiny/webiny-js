import { NotFoundError } from "@webiny/handler-graphql";
import { createTopic } from "@webiny/pubsub";
import WebinyError from "@webiny/error";
import { Tenant } from "@webiny/api-tenancy/types";
import { I18NLocale } from "@webiny/api-i18n/types";
import { parseIdentifier, zeroPad } from "@webiny/utils";

import {
    FbFormStats,
    FormBuilder,
    FormStatsCRUD,
    OnFormStatsBeforeCreate,
    OnFormStatsAfterCreate,
    OnFormStatsBeforeUpdate,
    OnFormStatsAfterUpdate,
    OnFormStatsBeforeDelete,
    OnFormStatsAfterDelete
} from "~/types";

const getFormStatsId = (formRevisionId: string) => {
    const { id: formId, version } = parseIdentifier(formRevisionId);

    if (version === null) {
        throw new WebinyError("Wrong form revision id value", "GET_FORM_STATS_ID_ERROR", {
            id: formRevisionId
        });
    }

    return `${formId}-${zeroPad(version)}-stats`;
};

interface CreateFormStatsCrudParams {
    getTenant: () => Tenant;
    getLocale: () => I18NLocale;
}

export const createFormStatsCrud = (params: CreateFormStatsCrudParams): FormStatsCRUD => {
    const { getTenant, getLocale } = params;

    // create
    const onFormStatsBeforeCreate = createTopic<OnFormStatsBeforeCreate>(
        "formBuilder.onFormStatsBeforeCreate"
    );
    const onFormStatsAfterCreate = createTopic<OnFormStatsAfterCreate>(
        "formBuilder.onFormStatsAfterCreate"
    );
    // update
    const onFormStatsBeforeUpdate = createTopic<OnFormStatsBeforeUpdate>(
        "formBuilder.onFormStatsBeforeUpdate"
    );
    const onFormStatsAfterUpdate = createTopic<OnFormStatsAfterUpdate>(
        "formBuilder.onFormStatsAfterUpdate"
    );
    // delete
    const onFormStatsBeforeDelete = createTopic<OnFormStatsBeforeDelete>(
        "formBuilder.onFormStatsBeforeDelete"
    );
    const onFormStatsAfterDelete = createTopic<OnFormStatsAfterDelete>(
        "formBuilder.onFormStatsAfterDelete"
    );

    return {
        onFormStatsBeforeCreate,
        onFormStatsAfterCreate,
        onFormStatsBeforeUpdate,
        onFormStatsAfterUpdate,
        onFormStatsBeforeDelete,
        onFormStatsAfterDelete,
        async getFormStats(this: FormBuilder, formRevisionId) {
            const id = getFormStatsId(formRevisionId);

            try {
                const formStats = await this.storageOperations.formStats.getFormStats({
                    where: { id, tenant: getTenant().id, locale: getLocale().code }
                });

                if (!formStats) {
                    throw new NotFoundError("Form stats not found.");
                }

                return formStats;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not load form stats.",
                    ex.code || "GET_FORM_STATS_ERROR",
                    {
                        id
                    }
                );
            }
        },
        async getFormOverallStats(this: FormBuilder, id) {
            const { id: formId } = parseIdentifier(id);

            try {
                const formStats = await this.storageOperations.formStats.listFormStats({
                    where: { formId, tenant: getTenant().id, locale: getLocale().code }
                });

                if (!formStats?.length) {
                    throw new NotFoundError("Form overall stats not found.");
                }

                const overallFormStats = {
                    formId,
                    views: 0,
                    submissions: 0,
                    tenant: getTenant().id,
                    locale: getLocale().code
                };

                formStats.forEach(stat => {
                    overallFormStats.views += stat.views;
                    overallFormStats.submissions += stat.submissions;
                });

                return overallFormStats;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not load form overall stats.",
                    ex.code || "GET_FORM_OVERALL_STATS_ERROR",
                    {
                        id
                    }
                );
            }
        },
        async createFormStats(this: FormBuilder, form) {
            const id = getFormStatsId(form.id);

            const formStats: FbFormStats = {
                id,
                formId: form.formId,
                formVersion: form.version,
                views: 0,
                submissions: 0,
                tenant: getTenant().id,
                locale: getLocale().code
            };

            try {
                await onFormStatsBeforeCreate.publish({
                    formStats
                });
                const result = await this.storageOperations.formStats.createFormStats({
                    formStats
                });
                await onFormStatsAfterCreate.publish({
                    formStats: result
                });

                return result;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not create form stats.",
                    ex.code || "CREATE_FORM_STATS_ERROR",
                    {
                        ...(ex.data || {}),
                        input: form,
                        formStats
                    }
                );
            }
        },
        async updateFormStats(this: FormBuilder, formRevisionId, input) {
            const original = await this.getFormStats(formRevisionId);

            if (!original) {
                throw new NotFoundError("Form stats not found.");
            }

            const formStats = { ...original, ...input };

            try {
                await onFormStatsBeforeUpdate.publish({
                    original,
                    formStats
                });
                const result = await this.storageOperations.formStats.updateFormStats({
                    formStats
                });
                await onFormStatsAfterUpdate.publish({
                    original,
                    formStats: result
                });
                return result;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not update form stats.",
                    ex.code || "UPDATE_FORM_STATS_ERROR",
                    {
                        input,
                        original,
                        formStats
                    }
                );
            }
        },
        async deleteFormStats(this: FormBuilder, formId) {
            const formStats =
                (await this.storageOperations.formStats.listFormStats({
                    where: { formId, tenant: getTenant().id, locale: getLocale().code }
                })) || [];

            const formStatsIds = formStats.map(formStat => formStat.id);

            try {
                await onFormStatsBeforeDelete.publish({
                    ids: formStatsIds
                });
                await this.storageOperations.formStats.deleteFormStats({
                    ids: formStatsIds,
                    tenant: getTenant().id,
                    locale: getLocale().code
                });
                await onFormStatsAfterDelete.publish({
                    ids: formStatsIds
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not delete form stats.",
                    ex.code || "DELETE_FORM_STATS_ERROR",
                    {
                        ids: formStatsIds
                    }
                );
            }
        }
    };
};
