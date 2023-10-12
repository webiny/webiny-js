import slugify from "slugify";
import { NotFoundError } from "@webiny/handler-graphql";
import * as models from "./forms.models";
import {
    FbForm,
    FbFormStats,
    FormBuilder,
    FormBuilderContext,
    FormBuilderStorageOperationsListFormsParams,
    FormsCRUD,
    OnFormAfterCreateTopicParams,
    OnFormAfterDeleteTopicParams,
    OnFormAfterPublishTopicParams,
    OnFormRevisionAfterCreateTopicParams,
    OnFormRevisionAfterDeleteTopicParams,
    OnFormAfterUnpublishTopicParams,
    OnFormAfterUpdateTopicParams,
    OnFormBeforeCreateTopicParams,
    OnFormBeforeDeleteTopicParams,
    OnFormBeforePublishTopicParams,
    OnFormRevisionBeforeCreateTopicParams,
    OnFormRevisionBeforeDeleteTopicParams,
    OnFormBeforeUnpublishTopicParams,
    OnFormBeforeUpdateTopicParams
} from "~/types";
import WebinyError from "@webiny/error";
import { Tenant } from "@webiny/api-tenancy/types";
import { I18NLocale } from "@webiny/api-i18n/types";
import { createIdentifier, mdbid } from "@webiny/utils";
import { createTopic } from "@webiny/pubsub";
import { getStatus } from "./utils";
import { FormsPermissions } from "~/plugins/crud/permissions/FormsPermissions";

export interface CreateFormsCrudParams {
    getTenant: () => Tenant;
    getLocale: () => I18NLocale;
    formsPermissions: FormsPermissions;
    context: FormBuilderContext;
}

export const createFormsCrud = (params: CreateFormsCrudParams): FormsCRUD => {
    const { context, getTenant, getLocale, formsPermissions } = params;

    // create
    const onFormBeforeCreate = createTopic<OnFormBeforeCreateTopicParams>(
        "formBuilder.onFormBeforeCreate"
    );
    const onFormAfterCreate = createTopic<OnFormAfterCreateTopicParams>(
        "formBuilder.onFormAfterCreate"
    );
    // create revision
    const onFormRevisionBeforeCreate = createTopic<OnFormRevisionBeforeCreateTopicParams>(
        "formBuilder.onFormRevisionBeforeCreate"
    );
    const onFormRevisionAfterCreate = createTopic<OnFormRevisionAfterCreateTopicParams>(
        "formBuilder.onFormRevisionAfterCreate"
    );
    // update
    const onFormBeforeUpdate = createTopic<OnFormBeforeUpdateTopicParams>(
        "formBuilder.onFormBeforeUpdate"
    );
    const onFormAfterUpdate = createTopic<OnFormAfterUpdateTopicParams>(
        "formBuilder.onFormAfterUpdate"
    );
    // delete
    const onFormBeforeDelete = createTopic<OnFormBeforeDeleteTopicParams>(
        "formBuilder.onFormBeforeDelete"
    );
    const onFormAfterDelete = createTopic<OnFormAfterDeleteTopicParams>(
        "formBuilder.onFormAfterDelete"
    );
    // delete form revision
    const onFormRevisionBeforeDelete = createTopic<OnFormRevisionBeforeDeleteTopicParams>(
        "formBuilder.onFormRevisionBeforeDelete"
    );
    const onFormRevisionAfterDelete = createTopic<OnFormRevisionAfterDeleteTopicParams>(
        "formBuilder.onFormRevisionAfterDelete"
    );
    // publish
    const onFormBeforePublish = createTopic<OnFormBeforePublishTopicParams>(
        "formBuilder.onFormBeforePublish"
    );
    const onFormAfterPublish = createTopic<OnFormAfterPublishTopicParams>(
        "formBuilder.onFormAfterPublish"
    );
    // unpublish
    const onFormBeforeUnpublish = createTopic<OnFormBeforeUnpublishTopicParams>(
        "formBuilder.onFormBeforeUnpublish"
    );
    const onFormAfterUnpublish = createTopic<OnFormAfterUnpublishTopicParams>(
        "formBuilder.onFormAfterUnpublish"
    );

    return {
        onFormBeforeCreate,
        onFormAfterCreate,
        onFormRevisionBeforeCreate,
        onFormRevisionAfterCreate,
        onFormBeforeUpdate,
        onFormAfterUpdate,
        onFormBeforeDelete,
        onFormAfterDelete,
        onFormRevisionBeforeDelete,
        onFormRevisionAfterDelete,
        onFormBeforePublish,
        onFormAfterPublish,
        onFormBeforeUnpublish,
        onFormAfterUnpublish,

        async getForm(this: FormBuilder, id, options) {
            if (options?.auth !== false) {
                await formsPermissions.ensure({ rwd: "r" });
            }

            let form: FbForm | null = null;
            try {
                form = await this.storageOperations.getForm({
                    where: {
                        id,
                        tenant: getTenant().id,
                        locale: getLocale().code
                    }
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not load form.",
                    ex.code || "GET_FORM_ERROR",
                    {
                        id
                    }
                );
            }

            if (!form) {
                throw new NotFoundError("Form not found.");
            }

            if (options?.auth !== false) {
                await formsPermissions.ensure({ owns: form.ownedBy });
            }

            return form;
        },
        async getFormStats(this: FormBuilder, id) {
            /**
             * We don't need to check permissions here, as this method is only called
             * as a resolver to an `FbForm` GraphQL type, and we already check permissions
             * and ownership when resolving the form in `getForm`.
             */
            const revisions = await this.getFormRevisions(id, {
                auth: false
            });

            /**
             * Then calculate the stats
             */
            const stats: FbFormStats = {
                submissions: 0,
                views: 0,
                conversionRate: 0
            };

            for (const form of revisions) {
                stats.views += form.stats.views;
                stats.submissions += form.stats.submissions;
            }

            let conversionRate = 0;
            if (stats.views > 0) {
                conversionRate = parseFloat(((stats.submissions / stats.views) * 100).toFixed(2));
            }

            return {
                ...stats,
                conversionRate
            };
        },
        async listForms(this: FormBuilder) {
            await formsPermissions.ensure({ rwd: "r" });

            const listFormParams: FormBuilderStorageOperationsListFormsParams = {
                where: {
                    tenant: getTenant().id,
                    locale: getLocale().code
                },
                limit: 10000,
                sort: ["savedOn_DESC"],
                after: null
            };

            if (await formsPermissions.canAccessOnlyOwnRecords()) {
                const identity = context.security.getIdentity();
                listFormParams.where.ownedBy = identity.id;
            }

            try {
                const { items } = await this.storageOperations.listForms(listFormParams);

                return items;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not list all forms by given params",
                    ex.code || "LIST_FORMS_ERROR",
                    {
                        ...(ex.data || {}),
                        params: listFormParams
                    }
                );
            }
        },
        async getFormRevisions(this: FormBuilder, id, options) {
            // Just get the form first, to check if it exists and if user has access to it.
            const [pid, revisionNumber = "0001"] = id.split("#");
            await this.getForm(`${pid}#${revisionNumber}`, options);

            try {
                return await this.storageOperations.listFormRevisions({
                    where: {
                        id,
                        tenant: getTenant().id,
                        locale: getLocale().code
                    },
                    sort: ["version_ASC"]
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not list form revisions.",
                    ex.code || "LIST_FORM_REVISIONS_ERROR",
                    {
                        id
                    }
                );
            }
        },
        async getPublishedFormRevisionById(this: FormBuilder, id) {
            const [formId, version] = id.split("#");
            if (!version) {
                throw new WebinyError("There is no version in given ID value.", "VERSION_ERROR", {
                    id
                });
            }

            let form: FbForm | null = null;
            try {
                form = await this.storageOperations.getForm({
                    where: {
                        formId,
                        version: Number(version),
                        published: true,
                        tenant: getTenant().id,
                        locale: getLocale().code
                    }
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not load published form revision by ID.",
                    ex.code || "GET_PUBLISHED_FORM_BY_ID_ERROR",
                    {
                        id
                    }
                );
            }
            if (!form) {
                throw new NotFoundError(`Form "${id}" was not found!`);
            }
            return form;
        },
        async getLatestPublishedFormRevision(this: FormBuilder, id) {
            /**
             * Make sure we have a unique form ID, and not a revision ID
             */
            const [formId] = id.split("#");

            let form: FbForm | null = null;
            try {
                form = await this.storageOperations.getForm({
                    where: {
                        formId,
                        published: true,
                        tenant: getTenant().id,
                        locale: getLocale().code
                    }
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not load published form revision by ID.",
                    ex.code || "GET_PUBLISHED_FORM_BY_ID_ERROR",
                    {
                        id
                    }
                );
            }
            if (!form) {
                throw new NotFoundError(`Form "${id}" was not found!`);
            }
            return form;
        },
        async createForm(this: FormBuilder, input) {
            await formsPermissions.ensure({ rwd: "w" });
            const identity = context.security.getIdentity();
            const dataModel = new models.FormCreateDataModel().populate(input);
            await dataModel.validate();

            const data = await dataModel.toJSON();

            /**
             * Forms are identified by a common parent ID + Revision number
             */
            const formId = mdbid();
            const version = 1;
            const id = createIdentifier({
                id: formId,
                version
            });

            const slug = `${slugify(data.name)}-${formId}`.toLowerCase();

            const form: FbForm = {
                id,
                formId,
                locale: getLocale().code,
                tenant: getTenant().id,
                savedOn: new Date().toISOString(),
                createdOn: new Date().toISOString(),
                createdBy: {
                    id: identity.id,
                    displayName: identity.displayName,
                    type: identity.type
                },
                ownedBy: {
                    id: identity.id,
                    displayName: identity.displayName,
                    type: identity.type
                },
                name: data.name,
                slug,
                version,
                locked: false,
                published: false,
                publishedOn: null,
                status: getStatus({
                    published: false,
                    locked: false
                }),
                stats: {
                    views: 0,
                    submissions: 0
                },
                /**
                 * Will be added via a "update"
                 */
                fields: [],
                // Our form should always have at least 1 step.
                // If we have more then 1 step then the Form will be recognized as a Multi Step Form.
                steps: [
                    {
                        title: "Step 1",
                        layout: [],
                        rules: []
                    }
                ],
                settings: await new models.FormSettingsModel().toJSON(),
                triggers: null,
                webinyVersion: context.WEBINY_VERSION
            };

            try {
                await onFormBeforeCreate.publish({
                    form
                });
                const result = await this.storageOperations.createForm({
                    input,
                    form
                });
                await onFormAfterCreate.publish({
                    form: result
                });
                return result;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not create form.",
                    ex.code || "CREATE_FORM_ERROR",
                    {
                        form
                    }
                );
            }
        },
        async updateForm(this: FormBuilder, id, input) {
            await formsPermissions.ensure({ rwd: "w" });
            const updateData = new models.FormUpdateDataModel().populate(input);
            await updateData.validate();
            const data = await updateData.toJSON({ onlyDirty: true });

            const original = await this.storageOperations.getForm({
                where: {
                    id,
                    tenant: getTenant().id,
                    locale: getLocale().code
                }
            });

            if (!original) {
                throw new NotFoundError(`Form "${id}" was not found!`);
            } else if (original.locked) {
                throw new WebinyError("Not allowed to modify locked form.", "FORM_LOCKED_ERROR", {
                    form: original
                });
            }

            await formsPermissions.ensure({ owns: original.ownedBy });

            const form: FbForm = {
                ...original,
                ...data,
                savedOn: new Date().toISOString(),
                tenant: getTenant().id,
                webinyVersion: context.WEBINY_VERSION
            };

            try {
                await onFormBeforeUpdate.publish({
                    form,
                    original
                });
                const result = await this.storageOperations.updateForm({
                    input: data,
                    form,
                    original
                });
                await onFormAfterUpdate.publish({
                    form,
                    original
                });
                return result;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not update form.",
                    ex.code || "UPDATE_FORM_ERROR",
                    {
                        input: data,
                        form,
                        original
                    }
                );
            }
        },
        async deleteForm(this: FormBuilder, id) {
            await formsPermissions.ensure({ rwd: "d" });

            const form = await this.storageOperations.getForm({
                where: {
                    id,
                    tenant: getTenant().id,
                    locale: getLocale().code
                }
            });

            if (!form) {
                throw new NotFoundError(`Form ${id} was not found!`);
            }

            await formsPermissions.ensure({ owns: form.ownedBy });

            try {
                await onFormBeforeDelete.publish({
                    form
                });
                await this.storageOperations.deleteForm({
                    form
                });
                await onFormAfterDelete.publish({
                    form
                });
                return true;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not delete form.",
                    ex.code || "DELETE_FORM_ERROR",
                    {
                        form
                    }
                );
            }
        },
        async deleteFormRevision(this: FormBuilder, id) {
            await formsPermissions.ensure({ rwd: "d" });

            const form = await this.getForm(id, {
                auth: false
            });

            await formsPermissions.ensure({ owns: form.ownedBy });

            const formFormId = form.formId || form.id.split("#").pop();

            const revisions = await this.storageOperations.listFormRevisions({
                where: {
                    formId: formFormId,
                    tenant: form.tenant,
                    locale: form.locale
                },
                sort: ["version_DESC"]
            });

            const previous = revisions.find(rev => rev.version < form.version) || null;
            if (!previous && revisions.length === 1) {
                /**
                 * Means we're deleting the last revision, so we need to delete the whole form.
                 */
                return this.deleteForm(form.id);
            }

            try {
                await onFormRevisionBeforeDelete.publish({
                    form,
                    previous,
                    revisions
                });
                await this.storageOperations.deleteFormRevision({
                    form,
                    previous,
                    revisions
                });
                await onFormRevisionAfterDelete.publish({
                    form,
                    previous,
                    revisions
                });
                return true;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not delete form revision.",
                    ex.code || "DELETE_FORM_REVISION_ERROR",
                    {
                        ...(ex.data || {}),
                        form
                    }
                );
            }
        },
        async publishForm(this: FormBuilder, id) {
            await formsPermissions.ensure({ rwd: "r", pw: "p" });

            /**
             * getForm checks for existence of the form.
             */
            const original = await this.getForm(id, {
                auth: false
            });

            await formsPermissions.ensure({ owns: original.ownedBy });

            const form: FbForm = {
                ...original,
                published: true,
                publishedOn: new Date().toISOString(),
                locked: true,
                savedOn: new Date().toISOString(),
                status: getStatus({ published: true, locked: true }),
                tenant: getTenant().id,
                webinyVersion: context.WEBINY_VERSION
            };

            try {
                await onFormBeforePublish.publish({
                    form
                });
                const result = await this.storageOperations.publishForm({
                    original,
                    form
                });
                await onFormAfterPublish.publish({
                    form
                });
                return result;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not publish form.",
                    ex.code || "PUBLISH_FORM_ERROR",
                    {
                        ...(ex.data || {}),
                        original,
                        form
                    }
                );
            }
        },
        async unpublishForm(this: FormBuilder, id) {
            await formsPermissions.ensure({ rwd: "r", pw: "u" });

            const original = await this.getForm(id, {
                auth: false
            });

            await formsPermissions.ensure({ owns: original.ownedBy });

            const form: FbForm = {
                ...original,
                published: false,
                savedOn: new Date().toISOString(),
                status: getStatus({ published: false, locked: true }),
                tenant: getTenant().id,
                webinyVersion: context.WEBINY_VERSION
            };

            try {
                await onFormBeforeUnpublish.publish({
                    form
                });
                const result = await this.storageOperations.unpublishForm({
                    original,
                    form
                });
                await onFormAfterUnpublish.publish({
                    form: result
                });
                return result;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not unpublish form.",
                    ex.code || "UNPUBLISH_FORM_ERROR",
                    {
                        ...(ex.data || {}),
                        original,
                        form
                    }
                );
            }
        },
        async createFormRevision(this: FormBuilder, id) {
            await formsPermissions.ensure({ rwd: "w" });

            const original = await this.getForm(id, {
                auth: false
            });

            const originalFormFormId = original.formId || (original.id.split("#").pop() as string);

            const latest = await this.storageOperations.getForm({
                where: {
                    formId: originalFormFormId,
                    latest: true,
                    tenant: original.tenant,
                    locale: original.locale
                }
            });
            if (!latest) {
                throw new WebinyError(
                    "Could not fetch latest form revision.",
                    "LATEST_FORM_REVISION_ERROR",
                    {
                        formId: originalFormFormId,
                        tenant: original.tenant,
                        locale: original.locale
                    }
                );
            }

            const identity = context.security.getIdentity();
            const version = (latest ? latest.version : original.version) + 1;

            const form: FbForm = {
                ...original,
                id: createIdentifier({
                    id: originalFormFormId,
                    version
                }),
                version,
                stats: {
                    submissions: 0,
                    views: 0
                },
                savedOn: new Date().toISOString(),
                createdOn: new Date().toISOString(),
                createdBy: {
                    id: identity.id,
                    displayName: identity.displayName,
                    type: identity.type
                },
                locked: false,
                published: false,
                publishedOn: null,
                status: getStatus({ published: false, locked: false }),
                tenant: getTenant().id,
                webinyVersion: context.WEBINY_VERSION
            };

            try {
                await onFormRevisionBeforeCreate.publish({
                    original,
                    latest,
                    form
                });
                const result = await this.storageOperations.createFormFrom({
                    original,
                    latest,
                    form
                });
                await onFormRevisionAfterCreate.publish({
                    original,
                    latest,
                    form: result
                });
                return result;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not create form from given one.",
                    ex.code || "CREATE_FORM_FROM_ERROR",
                    {
                        ...(ex.data || {}),
                        original,
                        form
                    }
                );
            }
        },
        async incrementFormViews(this: FormBuilder, id) {
            const original = await this.getForm(id, {
                auth: false
            });

            const form: FbForm = {
                ...original,
                stats: {
                    ...original.stats,
                    views: original.stats.views + 1
                },
                tenant: getTenant().id,
                webinyVersion: context.WEBINY_VERSION
            };

            try {
                await this.storageOperations.updateForm({
                    original,
                    form
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not update form stats views stats.",
                    ex.code || "UPDATE_FORM_STATS_VIEWS_ERROR",
                    {
                        original,
                        form
                    }
                );
            }

            return true;
        },
        async incrementFormSubmissions(this: FormBuilder, id) {
            const original = await this.getForm(id, {
                auth: false
            });

            const form: FbForm = {
                ...original,
                stats: {
                    ...original.stats,
                    submissions: original.stats.submissions + 1
                },
                tenant: getTenant().id,
                webinyVersion: context.WEBINY_VERSION
            };

            try {
                await this.storageOperations.updateForm({
                    original,
                    form
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not update form stats submissions stats.",
                    ex.code || "UPDATE_FORM_STATS_SUBMISSIONS_ERROR",
                    {
                        original,
                        form
                    }
                );
            }

            return true;
        }
    };
};
