import { describe, expect, it } from "vitest";
import { createRecordHandler, RecordHandler } from "~/resolver/app/RecordHandler.js";
import { createMockTransformHandler } from "~tests/mocks/transformHandler.js";
import { createMockCommandBundler, createMockTableBundler } from "~tests/mocks/bundler.js";
import {
    createMockSourceDeployment,
    createMockTargetDeployment
} from "~tests/mocks/deployments.js";
import { createMockStorer } from "~tests/mocks/storer.js";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import { createMockFetcher } from "~tests/mocks/fetcher.js";
import { createDeployments } from "~/resolver/deployment/Deployments.js";
import { createIngestorResult } from "~/resolver/app/ingestor/IngestorResult.js";
import { createMockPluginsContainer } from "~tests/mocks/plugins.js";
import { SourceDataContainer } from "~/resolver/app/data/SourceDataContainer.js";

describe("RecordHandler", () => {
    const createDocumentClient = () => {
        return getDocumentClient();
    };
    const plugins = createMockPluginsContainer();
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
            storer,
            createSourceDataContainer: () => {
                return SourceDataContainer.create();
            }
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
            storer,
            createSourceDataContainer: () => {
                return SourceDataContainer.create();
            }
        });
        const ingestorResult = createIngestorResult();
        const result = await handler.handle({
            data: ingestorResult
        });

        expect(result).toEqual(undefined);
    });
});
