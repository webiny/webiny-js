// @flow
import { getFilesDigets } from "./utils";
import gql from "graphql-tag";
import type ApolloClient from "apollo-client";
import debug from "debug";
import createApi from "./createApi";

const log = debug("wcc");

export default class Client {
    api: ApolloClient;

    init(apiToken: string = "") {
        this.api = createApi({
            token: apiToken,
            uri: process.env.WEBINY_CLOUD_API || "https://api.webiny.com",
            defaultOptions: {
                query: {
                    fetchPolicy: "network-only",
                    errorPolicy: "all"
                }
            }
        });
    }

    log(...args: []) {
        log(...args);
    }

    async getFilesDigest(dir: string) {
        return await getFilesDigets(dir);
    }

    async createDeploy(hashes: Object) {
        log("Creating a new deploy:");
        Object.keys(hashes).map(k => log("%s - %o", hashes[k], k));

        const mutation = gql`
            mutation CreateDeploy($files: JSON) {
                createDeploy(files: $files) {
                    id
                    required
                }
            }
        `;

        const result = await this.api.mutate({ mutation, variables: { files: hashes } });

        return result.data.createDeploy;
    }

    async uploadFile(deployId: string, name: string, data: string) {
        log("Uploading > %o", name);
        const mutation = gql`
            mutation UploadFile($deployId: String, $name: String, $data: String) {
                uploadFile(deployId: $deployId, name: $name, data: $data)
            }
        `;

        const result = await this.api.mutate({
            mutation,
            variables: { deployId, name, data }
        });

        return result.data.uploadFile;
    }
}
