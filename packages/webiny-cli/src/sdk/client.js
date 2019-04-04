// @flow
import gql from "graphql-tag";
import fs from "fs-extra";
import path from "path";
import crypto from "crypto";
import glob from "glob";
import util from "util";
import chalk from "chalk";
import type ApolloClient from "apollo-client";
import debug from "debug";
import get from "lodash.get";
import request from "request";
import mime from "mime-types";
import createApi from "./createApi";
import SdkError from "./SdkError";

const log = debug("wcc");
const globFiles = util.promisify(glob);

export default class Client {
    api: ApolloClient;

    constructor({ token = "" }: { token: string }) {
        this.api = createApi({
            token,
            uri: process.env.WEBINY_CLOUD_API || "https://cloud.webiny.com/api",
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

    async whoami() {
        const query = gql`
            {
                currentUser {
                    data {
                        email
                    }
                    error {
                        code
                        data
                        message
                    }
                }
            }
        `;

        let result;
        try {
            result = await this.api.query({ query });
        } catch (err) {
            throw err.networkError ? new SdkError(err.networkError) : err;
        }
        const { data, error } = get(result, "data.currentUser", {});
        if (error) {
            throw new SdkError(error);
        }

        return data;
    }

    async sites() {
        const query = gql`
            {
                sites (perPage: 100) {
                    data {
                        id
                        name
                        freeHostname
                        customHostname
                    }
                    error {
                        code
                        data
                        message
                    }
                }
            }
        `;

        let result;
        try {
            result = await this.api.query({ query });
        } catch (err) {
            throw err.networkError ? new SdkError(err.networkError) : err;
        }

        const { data, error } = get(result, "data.sites", {});
        if (error) {
            throw new SdkError(error);
        }

        return data;
    }

    async isDeployActive(id: string) {
        const query = gql`
            query IsDeployActive($id: ID!) {
                isDeployActive(id: $id) {
                    data {
                        active
                        url
                    }
                    error {
                        code
                        message
                        data
                    }
                }
            }
        `;

        let result;
        try {
            result = await this.api.query({ query, variables: { id } });
        } catch (err) {
            throw err.networkError ? new SdkError(err.networkError) : err;
        }

        const { data, error } = get(result, "data.isDeployActive", {});
        if (error) {
            throw new SdkError(error);
        }

        return data;
    }

    async getFilesDigest(dir: string) {
        log(`Reading files from %o`, dir);
        const filePaths = await globFiles("**/*", { cwd: dir, nodir: true });
        const files = filePaths.map(file => {
            return {
                abs: path.join(dir, file),
                key: file,
                type: mime.lookup(path.join(dir, file))
            };
        });

        await Promise.all(
            files.map(async file => {
                file.hash = await this.getFileHash(file.abs);
            })
        );

        return files;
    }

    async getFileHash(file: string): Promise<string> {
        const content = await fs.readFile(file);
        const sha = crypto.createHash("sha1");
        sha.update(content);
        return sha.digest("hex");
    }

    async createDeploy(
        site: string,
        type: string,
        path: string,
        files: Array<{ key: string, hash: string , type: string}>,
        meta: ?Object = {}
    ) {
        log(`Creating ${chalk.blue(type)} deploy for path ${chalk.blue(path)}`);
        const deployFiles = files.map(({ key, hash, type }) => {
            log("%s - %s", hash, key);
            return { key, hash, type };
        });

        const mutation = gql`
            mutation CreateDeploy(
                $site: ID!
                $type: DeployType!
                $path: String!
                $files: [DeployFileInput]!
                $meta: DeployMetaInput
            ) {
                createDeploy(site: $site, type: $type, path: $path, files: $files, meta: $meta) {
                    data {
                        id
                        files {
                            key
                            type
                            hash
                            required
                        }
                    }
                    error {
                        code
                        message
                        data
                    }
                }
            }
        `;

        let result;

        try {
            const variables = { site, type, path, files: deployFiles, meta };
            result = await this.api.mutate({ mutation, variables });
        } catch (err) {
            throw err.networkError ? new SdkError(err.networkError) : err;
        }

        const { data, error } = get(result, "data.createDeploy", {});
        if (error) {
            throw new SdkError(error);
        }

        return data;
    }

    async activateDeploy(deployId: string) {
        const mutation = gql`
            mutation ActivateDeploy($deploy: ID!) {
                activateDeploy(id: $deploy) {
                    data
                    error {
                        code
                        message
                    }
                }
            }
        `;

        let result;
        try {
            const variables = { deploy: deployId };
            result = await this.api.mutate({ mutation, variables });
        } catch (err) {
            throw err.networkError ? new SdkError(err.networkError) : err;
        }

        const { data, error } = get(result, "data.activateDeploy", {});
        if (error) {
            throw new SdkError(error);
        }

        return data;
    }

    async presignFiles(siteId: string, deployId: string, files: Array<Object>) {
        const query = gql`
            query PresignFiles($siteId: ID!, $deployId: ID!, $files: [PresignedFileInput]) {
                presignFiles(site: $siteId, deploy: $deployId, files: $files) {
                    data {
                        key
                        presigned
                    }
                    error {
                        code
                        message
                    }
                }
            }
        `;

        let result;
        try {
            result = await this.api.query({
                query,
                variables: { siteId, deployId, files }
            });
        } catch (err) {
            throw err.networkError ? new SdkError(err.networkError) : err;
        }

        const { data, error } = get(result, "data.presignFiles", {});
        if (error) {
            throw new SdkError(error);
        }

        return data;
    }

    async uploadPresignedFile({ url, fields }: Object, content: string) {
        const options = {
            method: "POST",
            url,
            formData: {
                ...fields,
                file: content
            }
        };

        return new Promise((resolve, reject) => {
            request(options, error => {
                if (error) {
                    return reject(error);
                }
                resolve();
            });
        });
    }
}
