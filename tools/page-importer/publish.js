import gql from "graphql-tag";
import { GraphQLClient } from "graphql-request";

import { graphqlUrl, apiKey } from "./common.js";

const client = new GraphQLClient(graphqlUrl, {
    headers: {
        Authorization: `Bearer ${apiKey}`
    },
    keepalive: true
});

const listDraftPages = gql`
    query ListPages($after: String) {
        pageBuilder {
            listPages(where: { status: draft }, after: $after) {
                data {
                    id
                    uniquePageId
                    path
                    url
                    title
                }
                meta {
                    cursor
                }
            }
        }
    }
`;

const updatePage = gql`
    mutation UpdatePage($id: ID!, $path: String!, $title: String!) {
        pageBuilder {
            updatePage(id: $id, data: { path: $path, title: $title }) {
                data {
                    id
                    title
                    status
                    path
                    pid
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

const publishPage = gql`
    mutation PublishPage($id: ID!) {
        pageBuilder {
            publishPage(id: $id) {
                data {
                    id
                    title
                    status
                    path
                    pid
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

publishAll();

async function publishAll() {
    let after = undefined;
    while (true) {
        const listResult = await client.request(listDraftPages, {
            after: after
        });

        after = listResult.pageBuilder.listPages.meta.cursor;

        const pages = listResult.pageBuilder.listPages.data;

        if (!pages.length) {
            after = undefined;
            continue;
        }

        const promises = [];

        for (const page of pages) {
            promises.push(runUpdate(page));
        }

        await Promise.all(promises);
    }
}

async function runUpdate(page) {
    try {
        const suffix = randomString();

        page.path = `/welcome-to-webiny-${suffix}`;

        console.log(`Updating ${page.path} (${page.id})`);

        const result = await client.request(updatePage, {
            id: page.id,
            path: page.path,
            title: `Welcome to Webiny ${suffix}`
        });

        const error = result.pageBuilder.updatePage.error;
        if (error) {
            throw error;
        }

        await runPublish(page);
    } catch (e) {
        console.log(e.message);
    }
}

async function runPublish(page) {
    console.log(`Publishing ${page.path} (${page.id})`);

    const result = await client.request(publishPage, {
        id: page.id
    });

    const error = result.pageBuilder.publishPage.error;
    if (error) {
        throw error;
    }
}

function randomString() {
    const first = (Math.random() + 1).toString(36).substring(2);
    const second = (Math.random() + 1).toString(36).substring(2);

    return first + second;
}
