import slugify from "slugify";
import { NotFoundError } from "@webiny/handler-graphql";
import {
    FbForm,
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
    OnFormBeforeUpdateTopicParams,
    FORM_STATUS
} from "~/types";
import WebinyError from "@webiny/error";
import { Tenant } from "@webiny/api-tenancy/types";
import { I18NLocale } from "@webiny/api-i18n/types";
import { createIdentifier, mdbid, parseIdentifier } from "@webiny/utils";
import { createTopic } from "@webiny/pubsub";
import { createFormSettings } from "./utils";
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
                form = await this.storageOperations.forms.getForm({
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
                await formsPermissions.ensure({ owns: form.createdBy });
            }

            return form;
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
                return await this.storageOperations.forms.listForms(listFormParams);
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
        async getFormRevisions(this: FormBuilder, id) {
            try {
                const result = await this.storageOperations.forms.listFormRevisions({
                    where: {
                        formId: id,
                        tenant: getTenant().id,
                        locale: getLocale().code
                    },
                    sort: ["version_ASC"]
                });

                return result;
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
        async getPublishedFormRevisionById(this: FormBuilder, revisionId) {
            const { id: formId, version } = parseIdentifier(revisionId);

            if (!version) {
                throw new WebinyError("There is no version in given ID value.", "VERSION_ERROR", {
                    revisionId
                });
            }

            let form: FbForm | null = null;
            try {
                form = await this.storageOperations.forms.getForm({
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
                        revisionId
                    }
                );
            }
            if (!form) {
                throw new NotFoundError(`Form "${revisionId}" was not found!`);
            }
            return form;
        },
        async getLatestPublishedFormRevision(this: FormBuilder, formId) {
            let form: FbForm | null = null;
            try {
                form = await this.storageOperations.forms.getForm({
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
                        formId
                    }
                );
            }
            if (!form) {
                throw new NotFoundError(`Form "${formId}" was not found!`);
            }
            return form;
        },
        async createForm(this: FormBuilder, input) {
            await formsPermissions.ensure({ rwd: "w" });
            const identity = context.security.getIdentity();

            /**
             * Forms are identified by a common parent ID + Revision number
             */
            const formId = mdbid();
            const version = 1;

            const slug = `${slugify(input.name)}-${formId}`.toLowerCase();

            const form: FbForm = {
                id: formId,
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
                name: input.name,
                slug,
                version,
                status: FORM_STATUS.DRAFT,
                /**
                 * Will be added via a "update"
                 */
                fields: [],
                // Our form should always have at least 1 step.
                // If we have more then 1 step then the Form will be recognized as a Multi Step Form.
                steps: [
                    {
                        title: "Step 1",
                        layout: []
                    }
                ],
                settings: createFormSettings(),
                triggers: null,
                webinyVersion: context.WEBINY_VERSION
            };

            let result: FbForm;

            try {
                await onFormBeforeCreate.publish({
                    form
                });
                result = await this.storageOperations.forms.createForm({ form });
                await onFormAfterCreate.publish({
                    form: result
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not create form.",
                    ex.code || "CREATE_FORM_ERROR",
                    {
                        form
                    }
                );
            }

            try {
                await this.createFormStats(result);
            } catch (ex) {
                // If `formStats` creation fails, delete the form and rethrow the error.
                // TODO: Consider adding a unit test to cover this scenario.
                await this.deleteForm(result.id);

                throw ex;
            }

            return result;
        },
        async updateForm(this: FormBuilder, id, input) {
            await formsPermissions.ensure({ rwd: "w" });

            const original = await this.storageOperations.forms.getForm({
                where: {
                    id,
                    tenant: getTenant().id,
                    locale: getLocale().code
                }
            });

            if (!original) {
                throw new NotFoundError(`Form "${id}" was not found!`);
            } else if (original.status === FORM_STATUS.UNPUBLISHED) {
                throw new WebinyError("Not allowed to modify locked form.", "FORM_LOCKED_ERROR", {
                    form: original
                });
            }

            await formsPermissions.ensure({ owns: original.createdBy });

            const form: FbForm = {
                ...original,
                ...input
            };

            try {
                await onFormBeforeUpdate.publish({
                    form,
                    original
                });
                const result = await this.storageOperations.forms.updateForm({
                    form
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
                        input,
                        form,
                        original
                    }
                );
            }
        },
        async deleteForm(this: FormBuilder, id) {
            await formsPermissions.ensure({ rwd: "d" });

            const form = await this.storageOperations.forms.getForm({
                where: {
                    id,
                    tenant: getTenant().id,
                    locale: getLocale().code
                }
            });

            if (!form) {
                throw new NotFoundError(`Form ${id} was not found!`);
            }

            await formsPermissions.ensure({ owns: form.createdBy });

            try {
                await onFormBeforeDelete.publish({
                    form
                });
                await this.storageOperations.forms.deleteForm({
                    form
                });
                await onFormAfterDelete.publish({
                    form
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not delete form.",
                    ex.code || "DELETE_FORM_ERROR",
                    {
                        form
                    }
                );
            }

            await this.deleteFormStats(form.formId);

            return true;
        },
        async deleteFormRevision(this: FormBuilder, id) {
            await formsPermissions.ensure({ rwd: "d" });

            const form = await this.getForm(id, {
                auth: false
            });

            await formsPermissions.ensure({ owns: form.createdBy });

            const { id: formId } = parseIdentifier(form.id);

            const revisions = await this.storageOperations.forms.listFormRevisions({
                where: {
                    formId,
                    tenant: form.tenant,
                    locale: form.locale
                },
                sort: ["version_DESC"]
            });

            const previous = revisions.find(rev => rev.version < form.version) || null;
            if (revisions.length === 1) {
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
                await this.storageOperations.forms.deleteFormRevision({ form });
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

            const { id: pid, version } = parseIdentifier(id);
            const formId = createIdentifier({
                id: pid,
                version: version || 1
            });

            /**
             * getForm checks for existence of the form.
             */
            const form = await this.getForm(formId, {
                auth: false
            });

            await formsPermissions.ensure({ owns: form.createdBy });

            try {
                await onFormBeforePublish.publish({
                    form
                });
                const result = await this.storageOperations.forms.publishForm({
                    form
                });
                await onFormAfterPublish.publish({
                    form: result
                });
                return result;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not publish form.",
                    ex.code || "PUBLISH_FORM_ERROR",
                    {
                        ...(ex.data || {}),
                        form
                    }
                );
            }
        },
        async unpublishForm(this: FormBuilder, id) {
            await formsPermissions.ensure({ rwd: "r", pw: "u" });

            const form = await this.getForm(id, {
                auth: false
            });

            await formsPermissions.ensure({ owns: form.createdBy });

            try {
                await onFormBeforeUnpublish.publish({
                    form
                });
                const result = await this.storageOperations.forms.unpublishForm({
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
                        form
                    }
                );
            }
        },
        async createFormRevision(this: FormBuilder, id) {
            await formsPermissions.ensure({ rwd: "w" });

            const form = await this.getForm(id, {
                auth: false
            });

            let result: FbForm;

            try {
                await onFormRevisionBeforeCreate.publish({
                    form
                });
                result = await this.storageOperations.forms.createFormFrom({
                    form
                });
                await onFormRevisionAfterCreate.publish({
                    form: result
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not create form from given one.",
                    ex.code || "CREATE_FORM_FROM_ERROR",
                    {
                        ...(ex.data || {}),
                        form
                    }
                );
            }

            try {
                await this.createFormStats(result);
            } catch (ex) {
                // If `formStats` creation fails, delete the form revision and rethrow the error.
                // TODO: Consider adding a unit test to cover this scenario.
                await this.deleteFormRevision(result.id);

                throw ex;
            }

            return result;
        },
        async incrementFormViews(this: FormBuilder, id) {
            const original = await this.getFormStats(id);

            if (!original) {
                throw new NotFoundError(`Form stats for form "${id}" were not found!`);
            }

            const views = original.views + 1;

            try {
                await this.updateFormStats(id, {
                    views
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not update form stats views stats.",
                    ex.code || "UPDATE_FORM_STATS_VIEWS_ERROR",
                    {
                        original,
                        views
                    }
                );
            }

            return true;
        },
        async incrementFormSubmissions(this: FormBuilder, id) {
            const original = await this.getFormStats(id);

            if (!original) {
                throw new NotFoundError(`Form stats for form "${id}" were not found!`);
            }

            const submissions = original.submissions + 1;

            try {
                await this.updateFormStats(id, { submissions });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not update form stats submissions stats.",
                    ex.code || "UPDATE_FORM_STATS_SUBMISSIONS_ERROR",
                    {
                        original,
                        submissions
                    }
                );
            }

            return true;
        }
    };
};
