export const DATA_FIELD = /* GraphQL */ `
    {
        id
        # createdBy
        # updatedBy
        savedOn
        createdOn
        # deletedOn
        publishedOn
        version
        name
        # fields
        layout
        # settings
        triggers
        published
        locked
        status
        parent
        # revisions
        # publishedRevisions
        stats {
            views
            submissions
        }
        # overallStats
    }
`;

export const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

export const CREATE_FROM = /* GraphQL */ `
    mutation CreateForm($data: CreateFormInput!) {
        forms {
            createForm(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

// Create a new revision from an existing revision
export const CREATE_REVISION_FROM = /* GraphQL */ `
    mutation CreateRevisionFrom($revision: ID!) {
        forms {
            createRevisionFrom(revision: $revision) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_REVISION = /* GraphQL */ `
    mutation UpdateRevision($id: ID!, $data: UpdateFormInput!) {
        forms {
            updateRevision(id: $id, data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const PUBLISH_REVISION = /* GraphQL */ `
    mutation publishRevision($id: ID!) {
        forms {
            publishRevision(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UNPUBLISH_REVISION = /* GraphQL */ `
    mutation UnpublishRevision($id: ID!) {
        forms {
            unpublishRevision(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_FORM = /* GraphQL */ `
    mutation DeleteForm($id: ID!) {
        forms {
            deleteForm(id: $id) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_REVISION = /* GraphQL */ `
    mutation DeleteRevision($id: ID!) {
        forms {
            deleteRevision(id: $id) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const SAVE_FORM_VIEW = /* GraphQL */ `
    mutation SaveFormView($id: ID!) {
        forms {
            saveFormView(id: $id) {
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_FORM = /* GraphQL */ `
    query getForm($id: ID, $where: JSON, $sort: String) {
        forms {
            getForm(id: $id, where: $where, sort: $sort) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_PUBLISHED_FORM = /* GraphQL */ `
    query getPublishedForm($id: ID, $parent: ID, $slug: String, $version: Int) {
        forms {
            getPublishedForm(id: $id, parent: $parent, slug: $slug, version: $version) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_FORMS = /* GraphQL */ `
    query ListForms(
        $sort: JSON,
        $search: String,
        $parent: String,
        $limit: Int,
        $after: String,
        $before: String
    ) {
        forms {
            listForms(
                sort: $sort,
                search: $search,
                parent: $parent,
                limit: $limit,
                after: $after,
                before: $before
                ) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_PUBLISHED_FORMS = /* GraphQL */ `
    query ListPublishedForms(
        $search: String,
        $id: ID,
        $parent: ID,
        $slug: String,
        $version: Int,
        $tags: [String],
        $sort: FormSortInput,
        $limit: Int,
        $after: String,
        $before: String
    ) {
        forms {
            listPublishedForms(
                search: $search,
                id: $id,
                parent: $parent,
                slug: $slug,
                version: $version,
                tags: $tags,
                sort: $sort,
                limit: $limit,
                after: $after,
                before: $before
                ) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
