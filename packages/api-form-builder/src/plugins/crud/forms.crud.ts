import { ContextPlugin } from "@webiny/handler/types";
import mdbid from "mdbid";
import slugify from "slugify";
import pick from "lodash/pick";
import fetch from "node-fetch";
import { NotFoundError } from "@webiny/handler-graphql";
import { NotAuthorizedError } from "@webiny/api-security";
import * as utils from "./utils";
import { checkOwnership, encodeCursor } from "./utils";
import defaults from "./defaults";
import * as models from "./forms.models";
import { FbForm, FbSubmission, FormBuilderContext } from "../../types";
import WebinyError from "@webiny/error";

const TYPE_FORM = "fb.form";
const TYPE_FORM_LATEST = "fb.form.latest";
const TYPE_FORM_LATEST_PUBLISHED = "fb.form.latestPublished";
const TYPE_FORM_SUBMISSION = "fb.formSubmission";

const getESDataForLatestRevision = (form: FbForm, context: FormBuilderContext) => ({
    __type: "fb.form",
    tenant: context.tenancy.getCurrentTenant().id,
    webinyVersion: context.WEBINY_VERSION,
    id: form.id,
    createdOn: form.createdOn,
    savedOn: form.savedOn,
    name: form.name,
    slug: form.slug,
    published: form.published,
    publishedOn: form.publishedOn,
    version: form.version,
    locked: form.locked,
    status: form.status,
    createdBy: form.createdBy,
    ownedBy: form.ownedBy,
    locale: context.i18nContent.locale.code
});

const zeroPad = version => `${version}`.padStart(4, "0");

type DbItem<T = unknown> = T & {
    PK: string;
    SK: string;
    TYPE: string;
};

export default {
    type: "context",
    apply(context: FormBuilderContext) {
        const { db, i18nContent, elasticsearch, tenancy } = context;

        const PK_FORM = formId => `${utils.getPKPrefix(context)}F#${formId}`;
        const SK_FORM_REVISION = version => {
            return typeof version === "string" ? `REV#${version}` : `REV#${zeroPad(version)}`;
        };
        const SK_FORM_LATEST = () => "L";
        const SK_FORM_LATEST_PUBLISHED = () => "LP";
        const SK_SUBMISSION = submissionId => `FS#${submissionId}`;

        context.formBuilder = {
            ...context.formBuilder,
            forms: {
                async getForm(id) {
                    const permission = await utils.checkBaseFormPermissions(context, { rwd: "r" });

                    const [uniqueId, version] = id.split("#");

                    const [[form]] = await db.read<FbForm>({
                        ...defaults.db,
                        query: {
                            PK: PK_FORM(uniqueId),
                            SK: SK_FORM_REVISION(version)
                        }
                    });

                    utils.checkOwnership(form, permission, context);

                    return form;
                },
                async getFormStats(id) {
                    // We don't need to check permissions here, as this method is only called
                    // as a resolver to an `FbForm` GraphQL type, and we already check permissions
                    // and ownership when resolving the form in `getForm`.
                    const allRevisions = await this.getFormRevisions(id);

                    // Then calculate the stats
                    const stats = {
                        submissions: 0,
                        views: 0,
                        conversionRate: 0
                    };

                    for (let i = 0; i < allRevisions.length; i++) {
                        const revision = allRevisions[i];
                        stats.views += revision.stats.views;
                        stats.submissions += revision.stats.submissions;
                    }

                    let conversionRate = 0;
                    if (stats.views > 0) {
                        conversionRate = parseFloat(
                            ((stats.submissions / stats.views) * 100).toFixed(2)
                        );
                    }

                    return {
                        ...stats,
                        conversionRate
                    };
                },
                async listForms() {
                    const permission = await utils.checkBaseFormPermissions(context, { rwd: "r" });

                    const must: any = [
                        { term: { "__type.keyword": "fb.form" } },
                        { term: { "locale.keyword": i18nContent.locale.code } }
                    ];

                    // Only get records which are owned by current user.
                    if (permission.own === true) {
                        const identity = context.security.getIdentity();
                        must.push({
                            term: { "ownedBy.id.keyword": identity.id }
                        });
                    }

                    // When ES index is shared between tenants, we need to filter records by tenant ID
                    const sharedIndex = process.env.ELASTICSEARCH_SHARED_INDEXES === "true";
                    if (sharedIndex) {
                        const tenant = tenancy.getCurrentTenant();
                        must.push({ term: { "tenant.keyword": tenant.id } });
                    }

                    const body = {
                        query: {
                            bool: {
                                must
                            }
                        },
                        sort: [
                            {
                                savedOn: {
                                    order: "desc",

                                    unmapped_type: "date"
                                }
                            }
                        ],
                        size: 1000
                    };

                    // Get "latest" form revisions from Elasticsearch.
                    try {
                        const response = await elasticsearch.search({
                            ...defaults.es(context),
                            body
                        });

                        return response.body.hits.hits.map(item => item._source);
                    } catch (ex) {
                        throw new WebinyError(
                            ex.message || "Could not perform search.",
                            ex.code || "ELASTICSEARCH_ERROR",
                            {
                                body
                            }
                        );
                    }
                },
                async getFormRevisions(id) {
                    const permission = await utils.checkBaseFormPermissions(context, { rwd: "r" });
                    const [uniqueId] = id.split("#");

                    const [forms] = await db.read<FbForm>({
                        ...defaults.db,
                        query: {
                            PK: PK_FORM(uniqueId),
                            SK: { $beginsWith: "REV#" },
                            sort: { SK: -1 }
                        }
                    });

                    utils.checkOwnership(forms[0], permission, context);

                    return forms.sort((a, b) => b.version - a.version);
                },
                async getPublishedFormRevisionById(revisionId) {
                    const [uniqueId, version] = revisionId.split("#");

                    const [[form]] = await db.read<FbForm>({
                        ...defaults.db,
                        query: {
                            PK: PK_FORM(uniqueId),
                            SK: SK_FORM_REVISION(version)
                        }
                    });

                    if (!form || !form.published) {
                        throw new NotFoundError(`Form "${revisionId}" was not found!`);
                    }

                    return form;
                },
                async getLatestPublishedFormRevision(formId) {
                    // Make sure we have a unique form ID, and not a revision ID
                    const [uniqueId] = formId.split("#");

                    const [[latestPublishedItem]] = await db.read({
                        ...defaults.db,
                        query: {
                            PK: PK_FORM(uniqueId),
                            SK: SK_FORM_LATEST_PUBLISHED()
                        }
                    });

                    if (!latestPublishedItem) {
                        throw new NotFoundError(`Form "${formId}" was not found!`);
                    }

                    const [[form]] = await db.read<FbForm>({
                        ...defaults.db,
                        query: {
                            PK: PK_FORM(uniqueId),
                            SK: SK_FORM_REVISION(latestPublishedItem.version)
                        }
                    });

                    return form;
                },
                async createForm(data) {
                    await utils.checkBaseFormPermissions(context, { rwd: "w" });

                    const identity = context.security.getIdentity();
                    await new models.FormCreateDataModel().populate(data).validate();

                    // Forms are identified by a common parent ID + Revision number
                    const [uniqueId, version] = [mdbid(), 1];
                    const id = `${uniqueId}#${zeroPad(version)}`;

                    const form: FbForm = {
                        id,
                        locale: i18nContent.locale.code,
                        tenant: tenancy.getCurrentTenant().id,
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
                        slug: [slugify(data.name), uniqueId].join("-").toLowerCase(),
                        version,
                        locked: false,
                        published: false,
                        publishedOn: null,
                        status: utils.getStatus({ published: false, locked: false }),
                        stats: {
                            views: 0,
                            submissions: 0
                        },
                        // Will be added via a "update"
                        fields: [],
                        layout: [],
                        settings: await new models.FormSettingsModel().toJSON(),
                        triggers: null
                    };

                    const FORM_PK = PK_FORM(uniqueId);

                    await db
                        .batch()
                        .create({
                            ...defaults.db,
                            data: {
                                PK: FORM_PK,
                                SK: SK_FORM_REVISION(version),
                                TYPE: TYPE_FORM,
                                ...form
                            }
                        })
                        .create({
                            ...defaults.db,
                            data: {
                                PK: FORM_PK,
                                SK: SK_FORM_LATEST(),
                                TYPE: TYPE_FORM_LATEST,
                                id,
                                version
                            }
                        })
                        .create({
                            ...defaults.esDb,
                            data: {
                                PK: FORM_PK,
                                SK: SK_FORM_LATEST(),
                                index: defaults.es(context).index,
                                data: getESDataForLatestRevision(form, context)
                            }
                        })
                        .execute();

                    return form;
                },
                async updateForm(id, data) {
                    const permission = await utils.checkBaseFormPermissions(context, { rwd: "w" });
                    const updateData = new models.FormUpdateDataModel().populate(data);
                    await updateData.validate();

                    const [uniqueId, version] = id.split("#");
                    const FORM_PK = PK_FORM(uniqueId);

                    const [[[form]], [[latestForm]]] = await db
                        .batch()
                        .read({
                            ...defaults.db,
                            query: {
                                PK: FORM_PK,
                                SK: SK_FORM_REVISION(version)
                            }
                        })
                        .read({
                            ...defaults.db,
                            query: {
                                PK: FORM_PK,
                                SK: SK_FORM_LATEST()
                            }
                        })
                        .execute();

                    if (!form) {
                        throw new NotFoundError(`Form "${id}" was not found!`);
                    }

                    checkOwnership(form, permission, context);

                    const newData = Object.assign(await updateData.toJSON({ onlyDirty: true }), {
                        savedOn: new Date().toISOString()
                    });
                    Object.assign(form, newData);

                    // Finally save it to DB
                    const batch = db.batch().update({
                        ...defaults.db,
                        query: {
                            PK: FORM_PK,
                            SK: SK_FORM_REVISION(version)
                        },
                        data: form
                    });

                    // Update form in "Elastic Search"
                    if (latestForm.id === id) {
                        batch.update({
                            ...defaults.esDb,
                            query: {
                                PK: FORM_PK,
                                SK: SK_FORM_LATEST()
                            },
                            data: {
                                PK: FORM_PK,
                                SK: SK_FORM_LATEST(),
                                index: defaults.es(context).index,
                                data: getESDataForLatestRevision(form, context)
                            }
                        });
                    }

                    await batch.execute();

                    return form;
                },
                async deleteForm(id) {
                    const permission = await utils.checkBaseFormPermissions(context, { rwd: "d" });

                    const [uniqueId] = id.split("#");

                    const [items] = await db.read<DbItem<FbForm>>({
                        ...defaults.db,
                        query: {
                            PK: PK_FORM(uniqueId),
                            SK: { $gt: " " }
                        }
                    });

                    if (!items.length) {
                        throw new NotFoundError(`Form ${id} was not found!`);
                    }

                    const form = items.find(item => item.TYPE === TYPE_FORM);
                    checkOwnership(form, permission, context);

                    // Delete all items in batches of 25
                    await utils.paginateBatch<DbItem>(items, 25, async items => {
                        await db
                            .batch()
                            .delete(
                                ...items.map(item => ({
                                    ...defaults.db,
                                    query: { PK: item.PK, SK: item.SK }
                                }))
                            )
                            .execute();
                    });

                    // Delete items from "Elastic Search"
                    await db.delete({
                        ...defaults.esDb,
                        query: {
                            PK: PK_FORM(uniqueId),
                            SK: SK_FORM_LATEST()
                        }
                    });

                    return true;
                },
                async deleteRevision(id) {
                    const permission = await utils.checkBaseFormPermissions(context, { rwd: "d" });

                    const [uniqueId, version] = id.split("#");
                    const FORM_PK = PK_FORM(uniqueId);

                    // Load form, latest form and latest published form records
                    const [[[form]], [[lForm]], [[lpForm]]] = await db
                        .batch()
                        .read({
                            ...defaults.db,
                            query: {
                                PK: FORM_PK,
                                SK: SK_FORM_REVISION(version)
                            }
                        })
                        .read({
                            ...defaults.db,
                            query: {
                                PK: FORM_PK,
                                SK: SK_FORM_LATEST()
                            }
                        })
                        .read({
                            ...defaults.db,
                            query: {
                                PK: FORM_PK,
                                SK: SK_FORM_LATEST_PUBLISHED()
                            }
                        })
                        .execute();

                    if (!form) {
                        throw new NotFoundError(`Form "${id}" was not found!`);
                    }

                    checkOwnership(form, permission, context);

                    const batch = db.batch().delete({
                        ...defaults.db,
                        query: {
                            PK: FORM_PK,
                            SK: SK_FORM_REVISION(version)
                        }
                    });

                    if (lForm.id === id || (lpForm && lpForm.id === id)) {
                        // Get all form revisions
                        const [revisions] = await db.read<FbForm>({
                            ...defaults.db,
                            query: { PK: FORM_PK, SK: { $beginsWith: "REV#" } },
                            sort: { SK: -1 }
                        });

                        // Update or delete the "latest published" record
                        if (lpForm && lpForm.id === id) {
                            const publishedRevision = revisions
                                .filter(rev => rev.id !== id && rev.publishedOn !== null)
                                .sort(
                                    (a, b) =>
                                        new Date(b.publishedOn).getTime() -
                                        new Date(a.publishedOn).getTime()
                                )
                                .shift();

                            if (publishedRevision) {
                                batch.update({
                                    ...defaults.db,
                                    query: {
                                        PK: FORM_PK,
                                        SK: SK_FORM_LATEST_PUBLISHED()
                                    },
                                    data: {
                                        PK: FORM_PK,
                                        SK: SK_FORM_LATEST_PUBLISHED(),
                                        TYPE: TYPE_FORM_LATEST_PUBLISHED,
                                        id: publishedRevision.id,
                                        version: publishedRevision.version
                                    }
                                });
                            } else {
                                batch.delete({
                                    ...defaults.db,
                                    query: {
                                        PK: FORM_PK,
                                        SK: SK_FORM_LATEST_PUBLISHED()
                                    }
                                });
                            }
                        }

                        if (lForm.id === id) {
                            // Find revision right before the one being deleted
                            const prevRevision = revisions
                                .filter(rev => rev.version < form.version)
                                .sort((a, b) => b.version - a.version)
                                .shift();

                            if (!prevRevision && revisions.length === 1) {
                                // Means we're deleting the last revision, so we need to delete the whole form.
                                return this.deleteForm(uniqueId);
                            }

                            batch
                                .update({
                                    ...defaults.db,
                                    query: {
                                        PK: FORM_PK,
                                        SK: SK_FORM_LATEST()
                                    },
                                    data: {
                                        PK: FORM_PK,
                                        SK: SK_FORM_LATEST(),
                                        TYPE: TYPE_FORM_LATEST,
                                        id: prevRevision.id,
                                        version: prevRevision.version
                                    }
                                })
                                .update({
                                    ...defaults.esDb,
                                    query: {
                                        PK: FORM_PK,
                                        SK: SK_FORM_LATEST()
                                    },
                                    data: {
                                        PK: FORM_PK,
                                        SK: SK_FORM_LATEST(),
                                        index: defaults.es(context).index,
                                        data: getESDataForLatestRevision(prevRevision, context)
                                    }
                                });
                        }
                    }

                    await batch.execute();

                    return true;
                },
                async publishForm(id) {
                    const permission = await utils.checkBaseFormPermissions(context, {
                        rwd: "r",
                        pw: "p"
                    });

                    const [uniqueId, version] = id.split("#");

                    const [[[form]], [[latestForm]]] = await db
                        .batch()
                        .read({
                            ...defaults.db,
                            query: {
                                PK: PK_FORM(uniqueId),
                                SK: SK_FORM_REVISION(version)
                            }
                        })
                        .read({
                            ...defaults.db,
                            query: {
                                PK: PK_FORM(uniqueId),
                                SK: SK_FORM_LATEST()
                            }
                        })
                        .execute();

                    if (!form) {
                        throw new NotFoundError(`Form "${id}" was not found!`);
                    }

                    checkOwnership(form, permission, context);

                    const savedOn = new Date().toISOString();
                    const status = utils.getStatus({ published: true, locked: true });

                    Object.assign(form, {
                        published: true,
                        publishedOn: savedOn,
                        locked: true,
                        savedOn,
                        status
                    });

                    // Finally save it to DB
                    const batch = db
                        .batch()
                        .update({
                            ...defaults.db,
                            query: {
                                PK: PK_FORM(uniqueId),
                                SK: SK_FORM_REVISION(version)
                            },
                            data: form
                        })
                        .update({
                            ...defaults.db,
                            query: {
                                PK: PK_FORM(uniqueId),
                                SK: SK_FORM_LATEST_PUBLISHED()
                            },
                            data: {
                                PK: PK_FORM(uniqueId),
                                SK: SK_FORM_LATEST_PUBLISHED(),
                                TYPE: TYPE_FORM_LATEST_PUBLISHED,
                                id,
                                version: form.version
                            }
                        });

                    // Update form in "Elastic Search"
                    if (latestForm.id === id) {
                        batch.update({
                            ...defaults.esDb,
                            query: {
                                PK: PK_FORM(uniqueId),
                                SK: SK_FORM_LATEST()
                            },
                            data: {
                                PK: PK_FORM(uniqueId),
                                SK: SK_FORM_LATEST(),
                                index: defaults.es(context).index,
                                data: getESDataForLatestRevision(form, context)
                            }
                        });
                    }

                    await batch.execute();

                    return form;
                },
                async unpublishForm(id) {
                    const permission = await utils.checkBaseFormPermissions(context, {
                        rwd: "r",
                        pw: "u"
                    });

                    const [uniqueId, version] = id.split("#");
                    const FORM_PK = PK_FORM(uniqueId);

                    const [[[form]], [[latestForm]], [[latestPublishedForm]]] = await db
                        .batch()
                        .read({
                            ...defaults.db,
                            query: {
                                PK: FORM_PK,
                                SK: SK_FORM_REVISION(version)
                            }
                        })
                        .read({
                            ...defaults.db,
                            query: {
                                PK: FORM_PK,
                                SK: SK_FORM_LATEST()
                            }
                        })
                        .read({
                            ...defaults.db,
                            query: {
                                PK: FORM_PK,
                                SK: SK_FORM_LATEST_PUBLISHED()
                            }
                        })
                        .execute();

                    if (!form) {
                        throw new NotFoundError(`Form "${id}" was not found!`);
                    }

                    checkOwnership(form, permission, context);

                    const savedOn = new Date().toISOString();
                    const status = utils.getStatus({ published: false, locked: true });

                    Object.assign(form, {
                        published: false,
                        savedOn,
                        status
                    });

                    // Update DB item
                    const batch = db.batch().update({
                        ...defaults.db,
                        query: {
                            PK: FORM_PK,
                            SK: SK_FORM_REVISION(version)
                        },
                        data: form
                    });

                    // Update or delete "latest published" item from DB
                    if (latestPublishedForm.id === id) {
                        const [revisions] = await db.read<FbForm>({
                            ...defaults.db,
                            query: {
                                PK: FORM_PK,
                                SK: { $beginsWith: "REV#" }
                            },
                            sort: { SK: -1 }
                        });

                        // Find published revision with highest publishedOn data
                        const publishedRevision = revisions
                            .filter(rev => rev.id !== id && rev.publishedOn !== null)
                            .sort(
                                (a, b) =>
                                    new Date(b.publishedOn).getTime() -
                                    new Date(a.publishedOn).getTime()
                            )
                            .shift();

                        if (publishedRevision) {
                            batch.update({
                                ...defaults.db,
                                query: {
                                    PK: FORM_PK,
                                    SK: SK_FORM_LATEST_PUBLISHED()
                                },
                                data: {
                                    PK: FORM_PK,
                                    SK: SK_FORM_LATEST_PUBLISHED(),
                                    TYPE: TYPE_FORM_LATEST_PUBLISHED,
                                    id: publishedRevision.id,
                                    version: publishedRevision.version
                                }
                            });
                        } else {
                            batch.delete({
                                ...defaults.db,
                                query: {
                                    PK: FORM_PK,
                                    SK: SK_FORM_LATEST_PUBLISHED()
                                }
                            });
                        }
                    }

                    // Update form in "Elastic Search"
                    if (latestForm.id === id) {
                        batch.update({
                            ...defaults.esDb,
                            query: {
                                PK: PK_FORM(uniqueId),
                                SK: SK_FORM_LATEST()
                            },
                            data: {
                                PK: PK_FORM(uniqueId),
                                SK: SK_FORM_LATEST(),
                                index: defaults.es(context).index,
                                data: getESDataForLatestRevision(form, context)
                            }
                        });
                    }

                    await batch.execute();

                    return form;
                },
                async createFormRevision(sourceRevisionId) {
                    await utils.checkBaseFormPermissions(context, { rwd: "w" });

                    const batch = db.batch();

                    const [uniqueId, version] = sourceRevisionId.split("#");
                    const FORM_PK = PK_FORM(uniqueId);

                    const [[[form]], [[latestForm]]] = await batch
                        .read({
                            ...defaults.db,
                            query: {
                                PK: FORM_PK,
                                SK: SK_FORM_REVISION(version)
                            }
                        })
                        .read({
                            ...defaults.db,
                            query: {
                                PK: FORM_PK,
                                SK: SK_FORM_LATEST()
                            }
                        })
                        .execute();

                    if (!form) {
                        throw new NotFoundError(`Form "${sourceRevisionId}" was not found!`);
                    }

                    const identity = context.security.getIdentity();
                    const newVersion = latestForm.version + 1;
                    const id = `${uniqueId}#${zeroPad(newVersion)}`;

                    const newRevision: FbForm = {
                        id,
                        locale: form.locale,
                        savedOn: new Date().toISOString(),
                        createdOn: new Date().toISOString(),
                        createdBy: {
                            id: identity.id,
                            displayName: identity.displayName,
                            type: identity.type
                        },
                        ownedBy: form.ownedBy,
                        name: form.name,
                        slug: form.slug,
                        version: newVersion,
                        locked: false,
                        published: false,
                        publishedOn: null,
                        status: utils.getStatus({ published: false, locked: false }),
                        fields: form.fields,
                        layout: form.layout,
                        stats: {
                            submissions: 0,
                            views: 0
                        },
                        settings: form.settings,
                        triggers: form.triggers,
                        tenant: form.tenant
                    };

                    // Store form to DB and update `latest revision` item
                    await db
                        .batch()
                        .create({
                            ...defaults.db,
                            data: {
                                PK: FORM_PK,
                                SK: SK_FORM_REVISION(newVersion),
                                TYPE: "fb.form",
                                ...newRevision
                            }
                        })
                        .update({
                            ...defaults.db,
                            query: {
                                PK: FORM_PK,
                                SK: SK_FORM_LATEST()
                            },
                            data: {
                                PK: FORM_PK,
                                SK: SK_FORM_LATEST(),
                                TYPE: TYPE_FORM_LATEST,
                                id: newRevision.id,
                                version: newRevision.version
                            }
                        })
                        .update({
                            ...defaults.esDb,
                            query: {
                                PK: FORM_PK,
                                SK: SK_FORM_LATEST()
                            },
                            data: {
                                PK: FORM_PK,
                                SK: SK_FORM_LATEST(),
                                index: defaults.es(context).index,
                                data: getESDataForLatestRevision(newRevision, context)
                            }
                        })
                        .execute();

                    return newRevision;
                },
                async incrementFormViews(id) {
                    const [uniqueId, version] = id.split("#");
                    const FORM_PK = PK_FORM(uniqueId);
                    const FORM_SK = SK_FORM_REVISION(version);

                    const [[form]] = await db.read<FbForm>({
                        ...defaults.db,
                        query: {
                            PK: FORM_PK,
                            SK: FORM_SK
                        }
                    });

                    if (!form) {
                        throw new NotFoundError(`Form "${id}" was not found!`);
                    }

                    // Increment views
                    form.stats.views = form.stats.views + 1;

                    // Update "form stats" in DB.
                    await db.update({
                        ...defaults.db,
                        query: {
                            PK: FORM_PK,
                            SK: FORM_SK
                        },
                        data: {
                            stats: form.stats
                        }
                    });

                    return true;
                },
                async incrementFormSubmissions(id) {
                    const [uniqueId, version] = id.split("#");
                    const FORM_PK = PK_FORM(uniqueId);
                    const FORM_SK = SK_FORM_REVISION(version);

                    const [[form]] = await db.read<FbForm>({
                        ...defaults.db,
                        query: {
                            PK: FORM_PK,
                            SK: FORM_SK
                        }
                    });

                    if (!form) {
                        throw new NotFoundError(`Form "${id}" was not found!`);
                    }

                    // Increment submissions
                    form.stats.submissions++;

                    // Update "form stats" in DB.
                    await db.update({
                        ...defaults.db,
                        query: {
                            PK: FORM_PK,
                            SK: FORM_SK
                        },
                        data: {
                            stats: form.stats
                        }
                    });

                    return true;
                },
                async getSubmissionsByIds(formId, submissionIds) {
                    const [uniqueId] = formId.split("#");
                    const FORM_PK = PK_FORM(uniqueId);

                    const batch = db.batch();

                    batch.read(
                        ...submissionIds.map(submissionId => ({
                            ...defaults.db,
                            query: {
                                PK: FORM_PK,
                                SK: `FS#${submissionId}`
                            }
                        }))
                    );

                    const response = await batch.execute();

                    return response
                        .map(item => {
                            const [[formSubmission]] = item;
                            return formSubmission;
                        })
                        .filter(Boolean);
                },
                async listFormSubmissions(formId, options = {}) {
                    const { submissions } = await utils.checkBaseFormPermissions(context);

                    if (typeof submissions !== "undefined" && submissions !== true) {
                        throw new NotAuthorizedError();
                    }

                    /**
                     * Check if current identity is allowed to access this form.
                     */
                    await this.getForm(formId);

                    const { sort = { createdOn: -1 }, after = null } = options;
                    let { limit = 10 } = options;

                    // 10000 is a hard limit of ElasticSearch for `size` parameter.
                    if (limit >= 10000) {
                        limit = 9999;
                    }

                    const [uniqueId] = formId.split("#");

                    const filter: Record<string, any>[] = [
                        { term: { "__type.keyword": "fb.submission" } },
                        { term: { "locale.keyword": i18nContent.locale.code } },
                        // Load all form submissions no matter the revision
                        { term: { "form.parent.keyword": uniqueId } }
                    ];

                    // When ES index is shared between tenants, we need to filter records by tenant ID
                    const sharedIndex = process.env.ELASTICSEARCH_SHARED_INDEXES === "true";
                    if (sharedIndex) {
                        const tenant = tenancy.getCurrentTenant();
                        filter.push({ term: { "tenant.keyword": tenant.id } });
                    }

                    const body: Record<string, any> = {
                        query: {
                            bool: { filter }
                        },
                        size: limit + 1,
                        sort: [{ createdOn: { order: sort.createdOn > 0 ? "asc" : "desc" } }]
                    };

                    if (after) {
                        body["search_after"] = utils.decodeCursor(after);
                    }

                    const response = await elasticsearch.search({
                        ...defaults.es(context),
                        body
                    });

                    const { hits, total } = response.body.hits;
                    const items = hits.map(item => item._source);

                    const hasMoreItems = items.length > limit;
                    if (hasMoreItems) {
                        // Remove the last item from results, we don't want to include it.
                        items.pop();
                    }

                    // Cursor is the `sort` value of the last item in the array.
                    // https://www.elastic.co/guide/en/elasticsearch/reference/current/paginate-search-results.html#search-after

                    const meta = {
                        hasMoreItems,
                        totalCount: total.value,
                        cursor: items.length > 0 ? encodeCursor(hits[items.length - 1].sort) : null
                    };

                    return [items, meta];
                },
                async createFormSubmission(formId, reCaptchaResponseToken, rawData, meta) {
                    const { formBuilder } = context;

                    const [uniqueId, version] = formId.split("#");

                    const [[form]] = await db.read<FbForm>({
                        ...defaults.db,
                        query: {
                            PK: PK_FORM(uniqueId),
                            SK: SK_FORM_REVISION(version)
                        }
                    });

                    if (!form) {
                        throw new NotFoundError(`Form "${formId}" was not found!`);
                    }

                    const settings = await formBuilder.settings.getSettings({ auth: false });

                    if (settings.reCaptcha && settings.reCaptcha.enabled) {
                        if (!reCaptchaResponseToken) {
                            throw new Error("Missing reCAPTCHA response token - cannot verify.");
                        }

                        const { secretKey } = settings.reCaptcha;

                        const recaptchaResponse = await fetch(
                            "https://www.google.com/recaptcha/api/siteverify",
                            {
                                method: "POST",
                                body: JSON.stringify({
                                    secret: secretKey,
                                    response: reCaptchaResponseToken
                                })
                            }
                        );

                        let responseIsValid = false;
                        try {
                            const validationResponse = await recaptchaResponse.json();
                            if (validationResponse.success) {
                                responseIsValid = true;
                            }
                        } catch (e) {}

                        if (!responseIsValid) {
                            throw new Error("reCAPTCHA verification failed.");
                        }
                    }

                    // Validate data
                    const validatorPlugins = context.plugins.byType("fb-form-field-validator");
                    const { fields } = form;

                    const data = pick(
                        rawData,
                        fields.map(field => field.fieldId)
                    );

                    if (Object.keys(data).length === 0) {
                        throw new Error("Form data cannot be empty.");
                    }

                    const invalidFields = {};
                    for (let i = 0; i < fields.length; i++) {
                        const field = fields[i];
                        if (Array.isArray(field.validation)) {
                            for (let j = 0; j < field.validation.length; j++) {
                                const validator = field.validation[j];
                                const validatorPlugin = validatorPlugins.find(
                                    item => item.validator.name === validator.name
                                );

                                if (!validatorPlugin) {
                                    continue;
                                }

                                let isInvalid = true;
                                try {
                                    const result = await validatorPlugin.validator.validate(
                                        data[field.fieldId],
                                        validator
                                    );
                                    isInvalid = result === false;
                                } catch (e) {
                                    isInvalid = true;
                                }

                                if (isInvalid) {
                                    invalidFields[field.fieldId] =
                                        validator.message || "Invalid value";
                                }
                            }
                        }
                    }

                    if (Object.keys(invalidFields).length > 0) {
                        throw {
                            message: "Form submission contains invalid fields.",
                            data: { invalidFields }
                        };
                    }

                    // Use model for data validation and default values.
                    const submissionModel = new models.FormSubmissionCreateDataModel().populate({
                        data,
                        meta,
                        form: {
                            id: form.id,
                            parent: uniqueId,
                            name: form.name,
                            version: form.version,
                            fields: form.fields,
                            layout: form.layout
                        }
                    });

                    await submissionModel.validate();

                    const submission: FbSubmission = {
                        id: mdbid(),
                        locale: form.locale,
                        ownedBy: form.ownedBy,
                        ...(await submissionModel.toJSON())
                    };

                    // Store submission to DB
                    await db
                        .batch()
                        .create({
                            ...defaults.db,
                            data: {
                                PK: PK_FORM(uniqueId),
                                SK: SK_SUBMISSION(submission.id),
                                TYPE: TYPE_FORM_SUBMISSION,
                                tenant: form.tenant,
                                ...submission
                            }
                        })
                        .create({
                            ...defaults.esDb,
                            data: {
                                PK: PK_FORM(uniqueId),
                                SK: SK_SUBMISSION(submission.id),
                                index: defaults.es(context).index,
                                data: {
                                    __type: "fb.submission",
                                    webinyVersion: context.WEBINY_VERSION,
                                    createdOn: new Date().toISOString(),
                                    tenant: context.tenancy.getCurrentTenant().id,
                                    ...submission
                                }
                            }
                        })
                        .execute();

                    submission.logs = [
                        ...(submission.logs || []),
                        {
                            type: "info",
                            message: "Form submission created."
                        }
                    ];

                    try {
                        // Execute triggers
                        if (form.triggers) {
                            const plugins = context.plugins.byType("form-trigger-handler");
                            for (let i = 0; i < plugins.length; i++) {
                                const plugin = plugins[i];
                                if (form.triggers[plugin.trigger]) {
                                    await plugin.handle({
                                        form: form,
                                        addLog: log => {
                                            submission.logs = [...submission.logs, log];
                                        },
                                        data,
                                        meta,
                                        trigger: form.triggers[plugin.trigger]
                                    });
                                }
                            }
                        }

                        submission.logs = [
                            ...submission.logs,
                            {
                                type: "success",
                                message: "Form submitted successfully."
                            }
                        ];

                        await formBuilder.forms.incrementFormSubmissions(form.id);
                    } catch (e) {
                        submission.logs = [
                            ...submission.logs,
                            {
                                type: "error",
                                message: e.message
                            }
                        ];
                    } finally {
                        // Save submission to include the logs that were added during trigger processing.
                        await formBuilder.forms.updateSubmission(form.id, submission);
                    }

                    return submission;
                },
                async updateSubmission(formId, data) {
                    await new models.FormSubmissionUpdateDataModel().populate(data).validate();

                    const [uniqueId] = formId.split("#");

                    // Finally save it to DB
                    await db.update({
                        ...defaults.db,
                        query: {
                            PK: PK_FORM(uniqueId),
                            SK: SK_SUBMISSION(data.id)
                        },
                        data: {
                            logs: data.logs
                        }
                    });

                    return true;
                },
                async deleteSubmission(formId, submissionId) {
                    const [uniqueId] = formId.split("#");
                    await db
                        .batch()
                        .delete({
                            ...defaults.db,
                            query: {
                                PK: PK_FORM(uniqueId),
                                SK: SK_SUBMISSION(submissionId)
                            }
                        })
                        .delete({
                            ...defaults.esDb,
                            query: {
                                PK: PK_FORM(uniqueId),
                                SK: SK_SUBMISSION(submissionId)
                            }
                        })
                        .execute();

                    return true;
                }
            }
        };
    }
} as ContextPlugin<FormBuilderContext>;
