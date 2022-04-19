import gql from "graphql-tag";
import { GraphQLClient } from "graphql-request";

import { graphqlUrl, zipUrl, category, apiKey } from "./common.js";

let num = 1;

const client = new GraphQLClient(graphqlUrl, {
    headers: {
        Authorization: `Bearer ${apiKey}`
    },
    keepalive: true
});

const importMutation = gql`
    mutation PbImportPage($category: String!, $zipFileKey: String, $zipFileUrl: String) {
        pageBuilder {
            importPages(category: $category, zipFileKey: $zipFileKey, zipFileUrl: $zipFileUrl) {
                data {
                    task {
                        id
                        status
                        data
                        stats {
                            total
                            processing
                            pending
                            completed
                            failed
                            __typename
                        }
                        __typename
                    }
                    __typename
                }
                error {
                    code
                    message
                    data
                    __typename
                }
                __typename
            }
            __typename
        }
    }
`;

while (true) {
    const promises = [];
    for (let j = 0; j < 10; j++) {
        promises.push(runImport());
    }

    await Promise.all(promises);
}

async function runImport() {
    await client.request(importMutation, {
        category: category,
        zipFileUrl: zipUrl
    });

    console.log(`Imported ${num++}`);
}
