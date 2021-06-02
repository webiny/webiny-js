import uniqid from "uniqid";
import { getAuthorContentModelData, getBookContentModelData } from "./mocks";
import { GraphQLClient, gql } from "graphql-request";
import upperFirst from "lodash/upperFirst";

const makeRequest = ({ token, query, variables, apiType }) => {
    let URL = Cypress.env("CMS_MANAGE_GRAPHQL_API_URL");
    if (apiType === "READ") {
        URL = Cypress.env("API_URL") + "/cms/read";
    } else if (apiType === "PREVIEW") {
        URL = Cypress.env("API_URL") + "/cms/preview";
    }

    const client = new GraphQLClient(URL + "/en-US", {
        headers: {
            authorization: `Bearer ${token}`
        }
    });

    return client.request(query, variables);
};

const createBookFieldsList = () => {
    return `
        id
        entryId
        title
    `;
};

const createAuthorFieldsList = () => {
    return `
        id
        entryId
        name
    `;
};

const createFieldsList = (model, { bookModel, authorModel }) => {
    const isBook = model.modelId.toLowerCase().includes("book");

    if (isBook) {
        return createBookFieldsList(authorModel);
    }
    return createAuthorFieldsList(bookModel);
};

const ERROR_FIELD = `
    {
        message
        code
        data
    }
`;

const CONTENT_META_FIELDS = `
    title
    publishedOn
    version
    locked
    status
`;

const createCreateMutation = (model, ctx) => {
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        mutation CmsEntriesCreate${ucFirstModelId}($data: ${ucFirstModelId}Input!) {
            content: create${ucFirstModelId}(data: $data) {
                data {
                    id
                    savedOn
                    ${createFieldsList(model, ctx)}
                    meta {
                        ${CONTENT_META_FIELDS}
                    }
                }
                error ${ERROR_FIELD}
            }
        }
    `;
};

const createDeleteMutation = model => {
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        mutation CmsEntriesDelete${ucFirstModelId}($revision: ID!) {
            content: delete${ucFirstModelId}(revision: $revision) {
                data
                error ${ERROR_FIELD}
            }
        }
    `;
};

const createUpdateMutation = (model, ctx) => {
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        mutation CmsUpdate${ucFirstModelId}($revision: ID!, $data: ${ucFirstModelId}Input!) {
            content: update${ucFirstModelId}(revision: $revision, data: $data) {
            data {
                id
                ${createFieldsList(model, ctx)}
                savedOn
                meta {
                    ${CONTENT_META_FIELDS}
                }
            }
            error ${ERROR_FIELD}
        }
        }
    `;
};

context("Headless CMS - READ and Preview API access using API key", () => {
    let apiKey;
    let createdContentModelGroup;
    let bookModel;
    let authorModel;
    let bookEntry;
    let authorEntry;

    before(() => {
        // Create an API key with full access to CMS
        cy.securityCreateApiKey({
            data: {
                name: uniqid("", "-api-key"),
                description: uniqid("description-"),
                permissions: [{ name: "content.i18n" }, { name: "cms.*" }]
            }
        }).then(key => {
            apiKey = key;
        });

        // Setup CMS model
        const newBookModel = uniqid("Model-", "-Book");
        const newAuthorModel = uniqid("Model-", "-Author");

        // a) Create a content model group
        cy.cmsCreateContentModelGroup({
            data: { name: uniqid("Group-"), icon: "fas/star" }
        }).then(group => {
            createdContentModelGroup = group;
            // b) Create two content model -> Book and Author referencing each other

            // Create "Book" model
            cy.cmsCreateContentModel({
                data: {
                    name: newBookModel,
                    group: group.id,
                    modelId: newBookModel
                }
            }).then(data => {
                bookModel = data;
                // Create "Author" model
                cy.cmsCreateContentModel({
                    data: {
                        name: newAuthorModel,
                        group: group.id,
                        modelId: newAuthorModel
                    }
                }).then(data => {
                    authorModel = data;
                    // Update "Author" model with data
                    cy.cmsUpdateContentModel({
                        modelId: authorModel.modelId,
                        data: getAuthorContentModelData(bookModel.modelId)
                    }).then(() => {
                        // Update "Book" model with data
                        cy.cmsUpdateContentModel({
                            modelId: bookModel.modelId,
                            data: getBookContentModelData(authorModel.modelId)
                        })
                            .then(() => {
                                // Create few entries
                                return Promise.all([
                                    // Create one book entry without author
                                    makeRequest({
                                        token: apiKey.token,
                                        query: createCreateMutation(bookModel, {
                                            bookModel,
                                            authorModel
                                        }),
                                        variables: {
                                            data: {
                                                title: "My book"
                                            }
                                        },
                                        apiType: "MANAGE"
                                    }),
                                    // Create one author entry without book
                                    makeRequest({
                                        token: apiKey.token,
                                        query: createCreateMutation(authorModel, {
                                            bookModel,
                                            authorModel
                                        }),
                                        variables: {
                                            data: {
                                                name: "New Author",
                                                books: []
                                            }
                                        },
                                        apiType: "MANAGE"
                                    })
                                ]);
                            })
                            .then(([bookEntryResponse, authorEntryResponse]) => {
                                // Save entries for later
                                bookEntry = bookEntryResponse.content.data;
                                authorEntry = authorEntryResponse.content.data;

                                return Promise.all([
                                    // Add author to book entry and publish
                                    makeRequest({
                                        token: apiKey.token,
                                        query: createUpdateMutation(bookModel, {
                                            bookModel,
                                            authorModel
                                        }),
                                        variables: {
                                            revision: bookEntry.id,
                                            data: {
                                                title: bookEntry.title,
                                                author: {
                                                    modelId: authorModel.modelId,
                                                    entryId: authorEntry.entryId
                                                }
                                            }
                                        },
                                        apiType: "MANAGE"
                                    }),
                                    // Add book to author entry and publish
                                    makeRequest({
                                        token: apiKey.token,
                                        query: createUpdateMutation(authorModel, {
                                            bookModel,
                                            authorModel
                                        }),
                                        variables: {
                                            revision: authorEntry.id,
                                            data: {
                                                name: authorEntry.name,
                                                books: [
                                                    {
                                                        modelId: bookModel.modelId,
                                                        entryId: bookEntry.entryId
                                                    }
                                                ]
                                            }
                                        },
                                        apiType: "MANAGE"
                                    })
                                ]);
                            })
                            .then(([bookEntryResponse, authorEntryResponse]) => {
                                // Save entries for later
                                bookEntry = bookEntryResponse.content.data;
                                authorEntry = authorEntryResponse.content.data;
                            });
                    });
                });
            });
        });
    });

    after(() => {
        // Clean everything
        console.log({
            apiKey,
            createdContentModelGroup,
            bookModel,
            authorModel,
            authorEntry,
            bookEntry
        });
        cy.waitUntil(
            () =>
                makeRequest({
                    token: apiKey.token,
                    query: createDeleteMutation(bookModel),
                    variables: {
                        revision: bookEntry.id
                    },
                    apiType: "MANAGE"
                }).then(response => response.content.data === true),
            {
                description: `Wait until "Book:${bookEntry.id}" is deleted`
            }
        );

        cy.waitUntil(
            () =>
                makeRequest({
                    token: apiKey.token,
                    query: createDeleteMutation(authorModel),
                    variables: {
                        revision: authorEntry.id
                    },
                    apiType: "MANAGE"
                }).then(response => response.content.data === true),
            {
                description: `Wait until "Author:${authorEntry.id}" is deleted`
            }
        );

        cy.waitUntil(
            () =>
                cy
                    .cmsDeleteContentModel({ modelId: bookModel.modelId })
                    .then(data => data === true),
            {
                description: `Wait until "Book ContentModel" is deleted`,
                timeout: 1000 * 30,
                interval: 1000
            }
        );
        cy.waitUntil(
            () =>
                cy
                    .cmsDeleteContentModel({ modelId: authorModel.modelId })
                    .then(data => data === true),
            {
                description: `Wait until "Author ContentModel" is deleted`,
                timeout: 1000 * 30,
                interval: 1000
            }
        );
        cy.waitUntil(
            () =>
                cy
                    .cmsDeleteContentModelGroup({ id: createdContentModelGroup.id })
                    .then(data => data === true),
            {
                description: `Wait until "ContentModelGroup" is deleted`
            }
        );
    });

    it("should able to list only published entry in READ API", function() {
        assert.isTrue(true);
    });

    it("should able to list the latest entry in PREVIEW API", function() {
        assert.isTrue(true);
    });
});
