import { createRecordHandler, RecordHandler } from "~/resolver/app/RecordHandler.js";
import { createMockTransformHandler } from "~tests/mocks/transformHandler.js";
import { PluginsContainer } from "@webiny/plugins";
import { createMockCommandBundler, createMockTableBundler } from "~tests/mocks/bundler.js";
import {
    createMockSourceDeployment,
    createMockTargetDeployment
} from "~tests/mocks/deployments.js";
import { createMockStorer } from "~tests/mocks/storer.js";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb";
import { createMockFetcher } from "~tests/mocks/fetcher.js";
import { createDeployments } from "~/resolver/deployment/Deployments.js";
import { createIngestorResult } from "~/resolver/app/ingestor/IngestorResult.js";

describe("RecordHandler", () => {
    const createDocumentClient = () => {
        return getDocumentClient();
    };
    const plugins = new PluginsContainer();
    const transformHandler = createMockTransformHandler({
        plugins
    });
    const commandBundler = createMockCommandBundler();
    const tableBundler = createMockTableBundler();
    const sourceDeployment = createMockSourceDeployment();
    const targetDeployment = createMockTargetDeployment();

    const deployments = createDeployments({
        deployments: [sourceDeployment, targetDeployment]
    });
    const storer = createMockStorer({
        createDocumentClient
    });
    const fetcher = createMockFetcher({
        createDocumentClient
    });

    it("should create a RecordHandler instance", () => {
        const handler = createRecordHandler({
            plugins,
            transformHandler,
            commandBundler,
            tableBundler,
            deployments,
            fetcher,
            storer
        });
        expect(handler).toBeInstanceOf(RecordHandler);
    });

    it("should handle empty data", async () => {
        const handler = createRecordHandler({
            plugins,
            transformHandler,
            commandBundler,
            tableBundler,
            deployments,
            fetcher,
            storer
        });
        const ingestorResult = createIngestorResult();
        const result = await handler.handle({
            data: ingestorResult
        });

        expect(result).toEqual(undefined);
    });
});
