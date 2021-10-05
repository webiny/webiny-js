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
    FormsCRUD
} from "~/types";
import WebinyError from "@webiny/error";
import { Tenant } from "@webiny/api-tenancy/types";
import { I18NLocale } from "@webiny/api-i18n/types";
import { createIdentifier } from "@webiny/utils";

export interface Params {
    tenant: Tenant;
    locale: I18NLocale;
    context: FormBuilderContext;
}

export const createFormsCrud = (params: Params): FormsCRUD => {
    const { context, tenant, locale } = params;

    return {
        async getForm(this: FormBuilder, id, options) {
            let permission: FbFormPermission = undefined;
            if (!options || options.auth !== false) {
                permission = await utils.checkBaseFormPermissions(context, { rwd: "r" });
            }

            // const [uniqueId, version] = id.split("#");
            //
            // const [[form]] = await db.read<FbForm>({
            //     ...defaults.db,
            //     query: {
            //         PK: PK_FORM(uniqueId),
            //         SK: SK_FORM_REVISION(version)
            //     }
            // });
            //
            // utils.checkOwnership(form, permission, context);
            //
            // return form;

            let form: FbForm = undefined;
            try {
                form = await this.storageOperations.getForm({
                    where: {
                        id,
                        tenant: tenant.id,
                        locale: locale.code
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
            // We don't need to check permissions here, as this method is only called
            // as a resolver to an `FbForm` GraphQL type, and we already check permissions
            // and ownership when resolving the form in `getForm`.
            const revisions = await this.getFormRevisions(id);

            // Then calculate the stats
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
                    tenant: tenant.id,
                    locale: locale.code
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

            // const must: any = [
            //     { term: { "__type.keyword": "fb.form" } },
            //     { term: { "locale.keyword": locale.code } }
            // ];
            //
            // // Only get records which are owned by current user.
            // if (permission.own === true) {
            //     const identity = context.security.getIdentity();
            //     must.push({
            //         term: { "ownedBy.id.keyword": identity.id }
            //     });
            // }
            //
            // // When ES index is shared between tenants, we need to filter records by tenant ID
            // const sharedIndex = process.env.ELASTICSEARCH_SHARED_INDEXES === "true";
            // if (sharedIndex) {
            //     must.push({ term: { "tenant.keyword": tenant.id } });
            // }
            //
            // const body = {
            //     query: {
            //         bool: {
            //             must
            //         }
            //     },
            //     sort: [
            //         {
            //             savedOn: {
            //                 order: "desc",
            //
            //                 unmapped_type: "date"
            //             }
            //         }
            //     ],
            //     size: 1000
            // };
            //
            // // Get "latest" form revisions from Elasticsearch.
            // try {
            //     const response = await elasticsearch.search({
            //         ...defaults.es(context),
            //         body
            //     });
            //
            //     return response.body.hits.hits.map(item => item._source);
            // } catch (ex) {
            //     throw new WebinyError(
            //         ex.message || "Could not perform search.",
            //         ex.code || "ELASTICSEARCH_ERROR",
            //         {
            //             body
            //         }
            //     );
            // }
        },
        async getFormRevisions(this: FormBuilder, id) {
            const permission = await utils.checkBaseFormPermissions(context, { rwd: "r" });
            // const [uniqueId] = id.split("#");
            //
            // const [forms] = await db.read<FbForm>({
            //     ...defaults.db,
            //     query: {
            //         PK: PK_FORM(uniqueId),
            //         SK: { $beginsWith: "REV#" },
            //         sort: { SK: -1 }
            //     }
            // });
            //
            // utils.checkOwnership(forms[0], permission, context);
            //
            // return forms.sort((a, b) => b.version - a.version);

            try {
                const forms = await this.storageOperations.listFormRevisions({
                    where: {
                        id,
                        tenant: tenant.id,
                        locale: locale.code
                    }
                });
                if (forms.length === 0) {
                    return [];
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

            // const [[form]] = await db.read<FbForm>({
            //     ...defaults.db,
            //     query: {
            //         PK: PK_FORM(uniqueId),
            //         SK: SK_FORM_REVISION(version)
            //     }
            // });
            //
            // if (!form || !form.published) {
            //     throw new NotFoundError(`Form "${revisionId}" was not found!`);
            // }
            //
            //
            //
            // return form;

            let form: FbForm = undefined;
            try {
                form = await this.storageOperations.getForm({
                    where: {
                        formId,
                        version: Number(version),
                        published: true,
                        tenant: tenant.id,
                        locale: locale.code
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
            // Make sure we have a unique form ID, and not a revision ID
            const [formId] = id.split("#");

            // const [[latestPublishedItem]] = await db.read({
            //     ...defaults.db,
            //     query: {
            //         PK: PK_FORM(uniqueId),
            //         SK: SK_FORM_LATEST_PUBLISHED()
            //     }
            // });
            //
            // if (!latestPublishedItem) {
            //     throw new NotFoundError(`Form "${formId}" was not found!`);
            // }
            //
            // const [[form]] = await db.read<FbForm>({
            //     ...defaults.db,
            //     query: {
            //         PK: PK_FORM(uniqueId),
            //         SK: SK_FORM_REVISION(latestPublishedItem.version)
            //     }
            // });
            //
            // return form;

            let form: FbForm = undefined;
            try {
                form = await this.storageOperations.getForm({
                    where: {
                        formId,
                        published: true,
                        tenant: tenant.id,
                        locale: locale.code
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

            const data = dataModel.toJSON();

            // Forms are identified by a common parent ID + Revision number
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
                locale: locale.code,
                tenant: tenant.id,
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
                // Will be added via a "update"
                fields: [],
                layout: [],
                settings: await new models.FormSettingsModel().toJSON(),
                triggers: null,
                webinyVersion: context.WEBINY_VERSION
            };

            try {
                return await this.storageOperations.createForm({
                    input,
                    form
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
        },
        async updateForm(this: FormBuilder, id, input) {
            const permission = await utils.checkBaseFormPermissions(context, { rwd: "w" });
            const updateData = new models.FormUpdateDataModel().populate(input);
            await updateData.validate();
            const data = await updateData.toJSON({ onlyDirty: true });

            // const [uniqueId, version] = id.split("#");
            // const FORM_PK = PK_FORM(uniqueId);

            const original = await this.storageOperations.getForm({
                where: {
                    id,
                    tenant: tenant.id,
                    locale: locale.code
                }
            });

            // const [[[form]], [[latestForm]]] = await db
            //     .batch()
            //     .read({
            //         ...defaults.db,
            //         query: {
            //             PK: FORM_PK,
            //             SK: SK_FORM_REVISION(version)
            //         }
            //     })
            //     .read({
            //         ...defaults.db,
            //         query: {
            //             PK: FORM_PK,
            //             SK: SK_FORM_LATEST()
            //         }
            //     })
            //     .execute();

            if (!original) {
                throw new NotFoundError(`Form "${id}" was not found!`);
            }

            checkOwnership(original, permission, context);

            // const newData = Object.assign(), {
            //     savedOn: new Date().toISOString()
            // });
            const form: FbForm = {
                ...original,
                ...data,
                savedOn: new Date().toISOString(),
                webinyVersion: context.WEBINY_VERSION
            };
            // Object.assign(form, newData);

            // Finally save it to DB
            // const batch = db.batch().update({
            //     ...defaults.db,
            //     query: {
            //         PK: FORM_PK,
            //         SK: SK_FORM_REVISION(version)
            //     },
            //     data: form
            // });

            // Update form in "Elastic Search"
            // if (latestForm.id === id) {
            //     batch.update({
            //         ...defaults.esDb,
            //         query: {
            //             PK: FORM_PK,
            //             SK: SK_FORM_LATEST()
            //         },
            //         data: {
            //             PK: FORM_PK,
            //             SK: SK_FORM_LATEST(),
            //             index: defaults.es(context).index,
            //             data: getESDataForLatestRevision(form, context)
            // }
            // });
            // }

            // await batch.execute();
            //
            // return form;

            try {
                return await this.storageOperations.updateForm({
                    input: data,
                    form,
                    original
                });
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
                    tenant: tenant.id,
                    locale: locale.code
                }
            });

            if (!form) {
                throw new NotFoundError(`Form ${id} was not found!`);
            }

            checkOwnership(form, permission, context);

            try {
                await this.storageOperations.deleteForm({
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

            // const [uniqueId] = id.split("#");
            //
            // const [items] = await db.read<DbItem<FbForm>>({
            //     ...defaults.db,
            //     query: {
            //         PK: PK_FORM(uniqueId),
            //         SK: { $gt: " " }
            //     }
            // });
            //
            // if (!items.length) {
            //     throw new NotFoundError(`Form ${id} was not found!`);
            // }
            //
            // const form = items.find(item => item.TYPE === TYPE_FORM);
            // checkOwnership(form, permission, context);
            //
            // // Delete all items in batches of 25
            // await utils.paginateBatch<DbItem>(items, 25, async items => {
            //     await db
            //         .batch()
            //         .delete(
            //             ...items.map(item => ({
            //                 ...defaults.db,
            //                 query: { PK: item.PK, SK: item.SK }
            //             }))
            //         )
            //         .execute();
            // });
            //
            // // Delete items from "Elastic Search"
            // await db.delete({
            //     ...defaults.esDb,
            //     query: {
            //         PK: PK_FORM(uniqueId),
            //         SK: SK_FORM_LATEST()
            //     }
            // });
            //
            // return true;
        },
        async deleteFormRevision(this: FormBuilder, id) {
            const permission = await utils.checkBaseFormPermissions(context, { rwd: "d" });

            // const [formId] = id.split("#");
            //
            // const form = await this.storageOperations.getForm({
            //     where: {
            //         id,
            //         tenant: tenant.id,
            //         locale: locale.code
            //     }
            // });
            // if (!form) {
            //     throw new NotFoundError(`Form "${id}" was not found!`);
            // }

            const form = await this.getForm(id, {
                auth: false
            });
            checkOwnership(form, permission, context);

            try {
                await this.storageOperations.deleteFormRevision({
                    form
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
            /**
             * Find the latest form. This will be used to determine what to update.
             */
            // const latestForm = await this.storageOperations.getForm({
            //     where: {
            //         formId: form.formId,
            //         latest: true,
            //         tenant: tenant.id,
            //         locale: locale.code
            //     }
            // });
            /**
             * Find the latest published form. This will be used to determine if to delete the publish record or not.
             * It is possible that it is same as the revision we are deleting.
             */
            // const latestPublishedForm = await this.storageOperations.getForm({
            //     where: {
            //         formId: form.formId,
            //         published: true,
            //         tenant: tenant.id,
            //         locale: locale.code
            //     }
            // });
            /**
             * We also need to find revisions that were published, sort by publishedOn_DESC.
             * Basically, we need only the last one.
             */
            // const previouslyPublishedRevisions = await this.storageOperations.listFormRevisions({
            //     where: {
            //         formId: form.formId,
            //         version_not: form.version,
            //         publishedOn_not: null,
            //         tenant: tenant.id,
            //         locale: locale.code
            //     },
            //     sort: ["publishedOn_DESC"]
            // });

            // const [uniqueId, version] = id.split("#");
            // const FORM_PK = PK_FORM(uniqueId);
            //
            // // Load form, latest form and latest published form records
            // const [[[form]], [[lForm]], [[lpForm]]] = await db
            //     .batch()
            //     .read({
            //         ...defaults.db,
            //         query: {
            //             PK: FORM_PK,
            //             SK: SK_FORM_REVISION(version)
            //         }
            //     })
            //     .read({
            //         ...defaults.db,
            //         query: {
            //             PK: FORM_PK,
            //             SK: SK_FORM_LATEST()
            //         }
            //     })
            //     .read({
            //         ...defaults.db,
            //         query: {
            //             PK: FORM_PK,
            //             SK: SK_FORM_LATEST_PUBLISHED()
            //         }
            //     })
            //     .execute();
            //
            // if (!form) {
            //     throw new NotFoundError(`Form "${id}" was not found!`);
            // }
            //
            // checkOwnership(form, permission, context);
            //
            // const batch = db.batch().delete({
            //     ...defaults.db,
            //     query: {
            //         PK: FORM_PK,
            //         SK: SK_FORM_REVISION(version)
            //     }
            // });
            //
            // if (lForm.id === id || (lpForm && lpForm.id === id)) {
            //     // Get all form revisions
            //     const [revisions] = await db.read<FbForm>({
            //         ...defaults.db,
            //         query: { PK: FORM_PK, SK: { $beginsWith: "REV#" } },
            //         sort: { SK: -1 }
            //     });
            //
            //     // Update or delete the "latest published" record
            //     if (lpForm && lpForm.id === id) {
            //         const publishedRevision = revisions
            //             .filter(rev => rev.id !== id && rev.publishedOn !== null)
            //             .sort(
            //                 (a, b) =>
            //                     new Date(b.publishedOn).getTime() -
            //                     new Date(a.publishedOn).getTime()
            //             )
            //             .shift();
            //
            //         if (publishedRevision) {
            //             batch.update({
            //                 ...defaults.db,
            //                 query: {
            //                     PK: FORM_PK,
            //                     SK: SK_FORM_LATEST_PUBLISHED()
            //                 },
            //                 data: {
            //                     PK: FORM_PK,
            //                     SK: SK_FORM_LATEST_PUBLISHED(),
            //                     TYPE: TYPE_FORM_LATEST_PUBLISHED,
            //                     id: publishedRevision.id,
            //                     version: publishedRevision.version
            //                 }
            //             });
            //         } else {
            //             batch.delete({
            //                 ...defaults.db,
            //                 query: {
            //                     PK: FORM_PK,
            //                     SK: SK_FORM_LATEST_PUBLISHED()
            //                 }
            //             });
            //         }
            //     }
            //
            //     if (lForm.id === id) {
            //         // Find revision right before the one being deleted
            //         const prevRevision = revisions
            //             .filter(rev => rev.version < form.version)
            //             .sort((a, b) => b.version - a.version)
            //             .shift();
            //
            //         if (!prevRevision && revisions.length === 1) {
            //             // Means we're deleting the last revision, so we need to delete the whole form.
            //             return this.deleteForm(uniqueId);
            //         }
            //
            //         batch
            //             .update({
            //                 ...defaults.db,
            //                 query: {
            //                     PK: FORM_PK,
            //                     SK: SK_FORM_LATEST()
            //                 },
            //                 data: {
            //                     PK: FORM_PK,
            //                     SK: SK_FORM_LATEST(),
            //                     TYPE: TYPE_FORM_LATEST,
            //                     id: prevRevision.id,
            //                     version: prevRevision.version
            //                 }
            //             })
            //             .update({
            //                 ...defaults.esDb,
            //                 query: {
            //                     PK: FORM_PK,
            //                     SK: SK_FORM_LATEST()
            //                 },
            //                 data: {
            //                     PK: FORM_PK,
            //                     SK: SK_FORM_LATEST(),
            //                     index: defaults.es(context).index,
            //                     data: getESDataForLatestRevision(prevRevision, context)
            //                 }
            //             });
            //     }
            // }
            //
            // await batch.execute();
            //
            // return true;
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
                webinyVersion: context.WEBINY_VERSION
            };

            try {
                return await this.storageOperations.publishForm({
                    original,
                    form
                });
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

            // const [uniqueId, version] = id.split("#");
            //
            // const [[[form]], [[latestForm]]] = await db
            //     .batch()
            //     .read({
            //         ...defaults.db,
            //         query: {
            //             PK: PK_FORM(uniqueId),
            //             SK: SK_FORM_REVISION(version)
            //         }
            //     })
            //     .read({
            //         ...defaults.db,
            //         query: {
            //             PK: PK_FORM(uniqueId),
            //             SK: SK_FORM_LATEST()
            //         }
            //     })
            //     .execute();
            //
            // if (!form) {
            //     throw new NotFoundError(`Form "${id}" was not found!`);
            // }
            //
            // checkOwnership(form, permission, context);
            //
            // const savedOn = new Date().toISOString();
            // const status = utils.getStatus({ published: true, locked: true });
            //
            // Object.assign(form, {
            //     published: true,
            //     publishedOn: savedOn,
            //     locked: true,
            //     savedOn,
            //     status
            // });
            //
            // // Finally save it to DB
            // const batch = db
            //     .batch()
            //     .update({
            //         ...defaults.db,
            //         query: {
            //             PK: PK_FORM(uniqueId),
            //             SK: SK_FORM_REVISION(version)
            //         },
            //         data: form
            //     })
            //     .update({
            //         ...defaults.db,
            //         query: {
            //             PK: PK_FORM(uniqueId),
            //             SK: SK_FORM_LATEST_PUBLISHED()
            //         },
            //         data: {
            //             PK: PK_FORM(uniqueId),
            //             SK: SK_FORM_LATEST_PUBLISHED(),
            //             TYPE: TYPE_FORM_LATEST_PUBLISHED,
            //             id,
            //             version: form.version
            //         }
            //     });
            //
            // // Update form in "Elastic Search"
            // if (latestForm.id === id) {
            //     batch.update({
            //         ...defaults.esDb,
            //         query: {
            //             PK: PK_FORM(uniqueId),
            //             SK: SK_FORM_LATEST()
            //         },
            //         data: {
            //             PK: PK_FORM(uniqueId),
            //             SK: SK_FORM_LATEST(),
            //             index: defaults.es(context).index,
            //             data: getESDataForLatestRevision(form, context)
            //         }
            //     });
            // }
            //
            // await batch.execute();
            //
            // return form;
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
                webinyVersion: context.WEBINY_VERSION
            };

            try {
                return await this.storageOperations.unpublishForm({
                    original,
                    form
                });
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

            // const [uniqueId, version] = id.split("#");
            // const FORM_PK = PK_FORM(uniqueId);
            //
            // const [[[form]], [[latestForm]], [[latestPublishedForm]]] = await db
            //     .batch()
            //     .read({
            //         ...defaults.db,
            //         query: {
            //             PK: FORM_PK,
            //             SK: SK_FORM_REVISION(version)
            //         }
            //     })
            //     .read({
            //         ...defaults.db,
            //         query: {
            //             PK: FORM_PK,
            //             SK: SK_FORM_LATEST()
            //         }
            //     })
            //     .read({
            //         ...defaults.db,
            //         query: {
            //             PK: FORM_PK,
            //             SK: SK_FORM_LATEST_PUBLISHED()
            //         }
            //     })
            //     .execute();
            //
            // if (!form) {
            //     throw new NotFoundError(`Form "${id}" was not found!`);
            // }
            //
            // checkOwnership(form, permission, context);
            //
            // const savedOn = new Date().toISOString();
            // const status = utils.getStatus({ published: false, locked: true });
            //
            // Object.assign(form, {
            //     published: false,
            //     savedOn,
            //     status
            // });
            //
            // // Update DB item
            // const batch = db.batch().update({
            //     ...defaults.db,
            //     query: {
            //         PK: FORM_PK,
            //         SK: SK_FORM_REVISION(version)
            //     },
            //     data: form
            // });
            //
            // // Update or delete "latest published" item from DB
            // if (latestPublishedForm.id === id) {
            //     const [revisions] = await db.read<FbForm>({
            //         ...defaults.db,
            //         query: {
            //             PK: FORM_PK,
            //             SK: { $beginsWith: "REV#" }
            //         },
            //         sort: { SK: -1 }
            //     });
            //
            //     // Find published revision with highest publishedOn data
            //     const publishedRevision = revisions
            //         .filter(rev => rev.id !== id && rev.publishedOn !== null)
            //         .sort(
            //             (a, b) =>
            //                 new Date(b.publishedOn).getTime() - new Date(a.publishedOn).getTime()
            //         )
            //         .shift();
            //
            //     if (publishedRevision) {
            //         batch.update({
            //             ...defaults.db,
            //             query: {
            //                 PK: FORM_PK,
            //                 SK: SK_FORM_LATEST_PUBLISHED()
            //             },
            //             data: {
            //                 PK: FORM_PK,
            //                 SK: SK_FORM_LATEST_PUBLISHED(),
            //                 TYPE: TYPE_FORM_LATEST_PUBLISHED,
            //                 id: publishedRevision.id,
            //                 version: publishedRevision.version
            //             }
            //         });
            //     } else {
            //         batch.delete({
            //             ...defaults.db,
            //             query: {
            //                 PK: FORM_PK,
            //                 SK: SK_FORM_LATEST_PUBLISHED()
            //             }
            //         });
            //     }
            // }
            //
            // // Update form in "Elastic Search"
            // if (latestForm.id === id) {
            //     batch.update({
            //         ...defaults.esDb,
            //         query: {
            //             PK: PK_FORM(uniqueId),
            //             SK: SK_FORM_LATEST()
            //         },
            //         data: {
            //             PK: PK_FORM(uniqueId),
            //             SK: SK_FORM_LATEST(),
            //             index: defaults.es(context).index,
            //             data: getESDataForLatestRevision(form, context)
            //         }
            //     });
            // }
            //
            // await batch.execute();
            //
            // return form;
        },
        async createFormRevision(this: FormBuilder, id) {
            await utils.checkBaseFormPermissions(context, { rwd: "w" });

            const original = await this.getForm(id, {
                auth: false
            });

            const latest = await this.storageOperations.getForm({
                where: {
                    formId: original.formId,
                    latest: true,
                    tenant: original.tenant,
                    locale: original.locale
                }
            });

            const identity = context.security.getIdentity();
            const version = (latest ? latest.version : original.version) + 1;

            const form: FbForm = {
                ...original,
                id: createIdentifier({
                    id: original.formId,
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
                status: utils.getStatus({ published: false, locked: false })
            };

            try {
                return this.storageOperations.createFormFrom({
                    original,
                    latest,
                    form
                });
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

            // const batch = db.batch();
            //
            // const [uniqueId, version] = sourceRevisionId.split("#");
            // const FORM_PK = PK_FORM(uniqueId);
            //
            // const [[[form]], [[latestForm]]] = await batch
            //     .read({
            //         ...defaults.db,
            //         query: {
            //             PK: FORM_PK,
            //             SK: SK_FORM_REVISION(version)
            //         }
            //     })
            //     .read({
            //         ...defaults.db,
            //         query: {
            //             PK: FORM_PK,
            //             SK: SK_FORM_LATEST()
            //         }
            //     })
            //     .execute();
            //
            // if (!form) {
            //     throw new NotFoundError(`Form "${sourceRevisionId}" was not found!`);
            // }
            //
            // const identity = context.security.getIdentity();
            // const newVersion = latestForm.version + 1;
            // const id = `${uniqueId}#${zeroPad(newVersion)}`;
            //
            // const newRevision: FbForm = {
            //     id,
            //     locale: form.locale,
            //     savedOn: new Date().toISOString(),
            //     createdOn: new Date().toISOString(),
            //     createdBy: {
            //         id: identity.id,
            //         displayName: identity.displayName,
            //         type: identity.type
            //     },
            //     ownedBy: form.ownedBy,
            //     name: form.name,
            //     slug: form.slug,
            //     version: newVersion,
            //     locked: false,
            //     published: false,
            //     publishedOn: null,
            //     status: utils.getStatus({ published: false, locked: false }),
            //     fields: form.fields,
            //     layout: form.layout,
            //     stats: {
            //         submissions: 0,
            //         views: 0
            //     },
            //     settings: form.settings,
            //     triggers: form.triggers,
            //     tenant: form.tenant
            // };
            //
            // // Store form to DB and update `latest revision` item
            // await db
            //     .batch()
            //     .create({
            //         ...defaults.db,
            //         data: {
            //             PK: FORM_PK,
            //             SK: SK_FORM_REVISION(newVersion),
            //             TYPE: "fb.form",
            //             ...newRevision
            //         }
            //     })
            //     .update({
            //         ...defaults.db,
            //         query: {
            //             PK: FORM_PK,
            //             SK: SK_FORM_LATEST()
            //         },
            //         data: {
            //             PK: FORM_PK,
            //             SK: SK_FORM_LATEST(),
            //             TYPE: TYPE_FORM_LATEST,
            //             id: newRevision.id,
            //             version: newRevision.version
            //         }
            //     })
            //     .update({
            //         ...defaults.esDb,
            //         query: {
            //             PK: FORM_PK,
            //             SK: SK_FORM_LATEST()
            //         },
            //         data: {
            //             PK: FORM_PK,
            //             SK: SK_FORM_LATEST(),
            //             index: defaults.es(context).index,
            //             data: getESDataForLatestRevision(newRevision, context)
            //         }
            //     })
            //     .execute();
            //
            // return newRevision;
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
                }
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
            // const [uniqueId, version] = id.split("#");
            // const FORM_PK = PK_FORM(uniqueId);
            // const FORM_SK = SK_FORM_REVISION(version);
            //
            // const [[form]] = await db.read<FbForm>({
            //     ...defaults.db,
            //     query: {
            //         PK: FORM_PK,
            //         SK: FORM_SK
            //     }
            // });
            //
            // if (!form) {
            //     throw new NotFoundError(`Form "${id}" was not found!`);
            // }
            //
            // // Increment views
            // form.stats.views = form.stats.views + 1;
            //
            // // Update "form stats" in DB.
            // await db.update({
            //     ...defaults.db,
            //     query: {
            //         PK: FORM_PK,
            //         SK: FORM_SK
            //     },
            //     data: {
            //         stats: form.stats
            //     }
            // });

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
                }
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

            // const [uniqueId, version] = id.split("#");
            // const FORM_PK = PK_FORM(uniqueId);
            // const FORM_SK = SK_FORM_REVISION(version);
            //
            // const [[form]] = await db.read<FbForm>({
            //     ...defaults.db,
            //     query: {
            //         PK: FORM_PK,
            //         SK: FORM_SK
            //     }
            // });
            //
            // if (!form) {
            //     throw new NotFoundError(`Form "${id}" was not found!`);
            // }
            //
            // // Increment submissions
            // form.stats.submissions++;
            //
            // // Update "form stats" in DB.
            // await db.update({
            //     ...defaults.db,
            //     query: {
            //         PK: FORM_PK,
            //         SK: FORM_SK
            //     },
            //     data: {
            //         stats: form.stats
            //     }
            // });

            return true;
        }
    };
};
