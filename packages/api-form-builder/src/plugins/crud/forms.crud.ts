/**
 * Package mdbid does not have types.
 */
// @ts-ignore
import mdbid from "mdbid";
import slugify from "slugify";
import { NotFoundError } from "@webiny/handler-graphql";
import * as utils from "./utils";
import { checkOwnership } from "./utils";
import * as models from "./forms.models";
import {
    FbForm,
    FbFormPermission,
    FbFormStats,
    FormBuilder,
    FormBuilderContext,
    FormBuilderStorageOperationsListFormsParams,
    FormsCRUD,
    OnAfterFormCreateTopicParams,
    OnAfterFormDeleteTopicParams,
    OnAfterFormPublishTopicParams,
    OnAfterFormRevisionCreateTopicParams,
    OnAfterFormRevisionDeleteTopicParams,
    OnAfterFormUnpublishTopicParams,
    OnAfterFormUpdateTopicParams,
    OnBeforeFormCreateTopicParams,
    OnBeforeFormDeleteTopicParams,
    OnBeforeFormPublishTopicParams,
    OnBeforeFormRevisionCreateTopicParams,
    OnBeforeFormRevisionDeleteTopicParams,
    OnBeforeFormUnpublishTopicParams,
    OnBeforeFormUpdateTopicParams
} from "~/types";
import WebinyError from "@webiny/error";
import { Tenant } from "@webiny/api-tenancy/types";
import { I18NLocale } from "@webiny/api-i18n/types";
import { createIdentifier } from "@webiny/utils";
import { createTopic } from "@webiny/pubsub";

export interface CreateFormsCrudParams {
    getTenant: () => Tenant;
    getLocale: () => I18NLocale;
    context: FormBuilderContext;
}

export const createFormsCrud = (params: CreateFormsCrudParams): FormsCRUD => {
    const { context, getTenant, getLocale } = params;

    // create
    const onBeforeFormCreate = createTopic<OnBeforeFormCreateTopicParams>(
        "formBuilder.onBeforeFormCreate"
    );
    const onAfterFormCreate = createTopic<OnAfterFormCreateTopicParams>(
        "formBuilder.onAfterFormCreate"
    );
    // create revision
    const onBeforeFormRevisionCreate = createTopic<OnBeforeFormRevisionCreateTopicParams>(
        "formBuilder.onBeforeFormRevisionCreate"
    );
    const onAfterFormRevisionCreate = createTopic<OnAfterFormRevisionCreateTopicParams>(
        "formBuilder.onAfterFormRevisionCreate"
    );
    // update
    const onBeforeFormUpdate = createTopic<OnBeforeFormUpdateTopicParams>(
        "formBuilder.onBeforeFormUpdate"
    );
    const onAfterFormUpdate = createTopic<OnAfterFormUpdateTopicParams>(
        "formBuilder.onAfterFormUpdate"
    );
    // delete
    const onBeforeFormDelete = createTopic<OnBeforeFormDeleteTopicParams>(
        "formBuilder.onBeforeFormDelete"
    );
    const onAfterFormDelete = createTopic<OnAfterFormDeleteTopicParams>(
        "formBuilder.onAfterFormDelete"
    );
    // delete form revision
    const onBeforeFormRevisionDelete = createTopic<OnBeforeFormRevisionDeleteTopicParams>(
        "formBuilder.onBeforeFormRevisionDelete"
    );
    const onAfterFormRevisionDelete = createTopic<OnAfterFormRevisionDeleteTopicParams>(
        "formBuilder.onAfterFormRevisionDelete"
    );
    // publish
    const onBeforeFormPublish = createTopic<OnBeforeFormPublishTopicParams>(
        "formBuilder.onBeforeFormPublish"
    );
    const onAfterFormPublish = createTopic<OnAfterFormPublishTopicParams>(
        "formBuilder.onAfterFormPublish"
    );
    // unpublish
    const onBeforeFormUnpublish = createTopic<OnBeforeFormUnpublishTopicParams>(
        "formBuilder.onBeforeFormUnpublish"
    );
    const onAfterFormUnpublish = createTopic<OnAfterFormUnpublishTopicParams>(
        "formBuilder.onAfterFormUnpublish"
    );

    return {
        onBeforeFormCreate,
        onAfterFormCreate,
        onBeforeFormRevisionCreate,
        onAfterFormRevisionCreate,
        onBeforeFormUpdate,
        onAfterFormUpdate,
        onBeforeFormDelete,
        onAfterFormDelete,
        onBeforeFormRevisionDelete,
        onAfterFormRevisionDelete,
        onBeforeFormPublish,
        onAfterFormPublish,
        onBeforeFormUnpublish,
        onAfterFormUnpublish,
        async getForm(this: FormBuilder, id, options) {
            let permission: FbFormPermission | null = null;
            if (!options || options.auth !== false) {
                permission = await utils.checkBaseFormPermissions(context, { rwd: "r" });
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
            } else if (permission) {
                utils.checkOwnership(form, permission, context);
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
            const permission = await utils.checkBaseFormPermissions(context, { rwd: "r" });

            const listFormParams: FormBuilderStorageOperationsListFormsParams = {
                where: {
                    tenant: getTenant().id,
                    locale: getLocale().code
                },
                limit: 10000,
                sort: ["savedOn_DESC"],
                after: null
            };

            if (permission.own === true) {
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
            let permission: FbFormPermission | null = null;
            if (!options || options.auth !== false) {
                permission = await utils.checkBaseFormPermissions(context, { rwd: "r" });
            }

            try {
                const forms = await this.storageOperations.listFormRevisions({
                    where: {
                        id,
                        tenant: getTenant().id,
                        locale: getLocale().code
                    },
                    sort: ["version_ASC"]
                });
                if (forms.length === 0 || !permission) {
                    return forms;
                }
                utils.checkOwnership(forms[0], permission, context);

                return forms;
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
            await utils.checkBaseFormPermissions(context, { rwd: "w" });

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
                status: utils.getStatus({
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
                layout: [],
                settings: await new models.FormSettingsModel().toJSON(),
                triggers: null,
                webinyVersion: context.WEBINY_VERSION
            };

            try {
                await onBeforeFormCreate.publish({
                    form
                });
                const result = await this.storageOperations.createForm({
                    input,
                    form
                });
                await onAfterFormCreate.publish({
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
            const permission = await utils.checkBaseFormPermissions(context, { rwd: "w" });
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

            checkOwnership(original, permission, context);

            const form: FbForm = {
                ...original,
                ...data,
                savedOn: new Date().toISOString(),
                tenant: getTenant().id,
                webinyVersion: context.WEBINY_VERSION
            };

            try {
                await onBeforeFormUpdate.publish({
                    form,
                    original
                });
                const result = await this.storageOperations.updateForm({
                    input: data,
                    form,
                    original
                });
                await onAfterFormUpdate.publish({
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
            const permission = await utils.checkBaseFormPermissions(context, { rwd: "d" });

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

            checkOwnership(form, permission, context);

            try {
                await onBeforeFormDelete.publish({
                    form
                });
                await this.storageOperations.deleteForm({
                    form
                });
                await onAfterFormDelete.publish({
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
            const permission = await utils.checkBaseFormPermissions(context, { rwd: "d" });

            const form = await this.getForm(id, {
                auth: false
            });
            checkOwnership(form, permission, context);

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
                await onBeforeFormRevisionDelete.publish({
                    form,
                    previous,
                    revisions
                });
                await this.storageOperations.deleteFormRevision({
                    form,
                    previous,
                    revisions
                });
                await onAfterFormRevisionDelete.publish({
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
            const permission = await utils.checkBaseFormPermissions(context, {
                rwd: "r",
                pw: "p"
            });
            /**
             * getForm checks for existence of the form.
             */
            const original = await this.getForm(id, {
                auth: false
            });
            checkOwnership(original, permission, context);

            const form: FbForm = {
                ...original,
                published: true,
                publishedOn: new Date().toISOString(),
                locked: true,
                savedOn: new Date().toISOString(),
                status: utils.getStatus({ published: true, locked: true }),
                tenant: getTenant().id,
                webinyVersion: context.WEBINY_VERSION
            };

            try {
                await onBeforeFormPublish.publish({
                    form
                });
                const result = await this.storageOperations.publishForm({
                    original,
                    form
                });
                await onAfterFormPublish.publish({
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
            const permission = await utils.checkBaseFormPermissions(context, {
                rwd: "r",
                pw: "u"
            });

            const original = await this.getForm(id, {
                auth: false
            });

            checkOwnership(original, permission, context);

            const form: FbForm = {
                ...original,
                published: false,
                savedOn: new Date().toISOString(),
                status: utils.getStatus({ published: false, locked: true }),
                tenant: getTenant().id,
                webinyVersion: context.WEBINY_VERSION
            };

            try {
                await onBeforeFormUnpublish.publish({
                    form
                });
                const result = await this.storageOperations.unpublishForm({
                    original,
                    form
                });
                await onAfterFormUnpublish.publish({
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
            await utils.checkBaseFormPermissions(context, { rwd: "w" });

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
                status: utils.getStatus({ published: false, locked: false }),
                tenant: getTenant().id,
                webinyVersion: context.WEBINY_VERSION
            };

            try {
                await onBeforeFormRevisionCreate.publish({
                    original,
                    latest,
                    form
                });
                const result = await this.storageOperations.createFormFrom({
                    original,
                    latest,
                    form
                });
                await onAfterFormRevisionCreate.publish({
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
