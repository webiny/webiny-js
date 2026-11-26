import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import type { CmsContentEntry, CmsModel } from "~/types.js";
import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import { EntryGraphQLFields } from "../abstractions.js";
import { GetEntryFeature } from "../getEntry/feature.js";
import { GetEntryGateway, GetEntryGraphQLFieldSelection } from "../getEntry/abstractions.js";
import { GetLatestSingletonEntryGateway as GatewayAbstraction } from "./getLatest/gatewayAbstractions.js";
import { GetLatestSingletonEntryGateway } from "./getLatest/GetLatestSingletonEntryGateway.js";
import { GetLatestSingletonEntryFeature } from "./getLatest/feature.js";
import { GetLatestSingletonEntryUseCase } from "./getLatest/abstractions.js";
import { GetEntryGatewaySingletonDecorator } from "./getRevision/GetEntryGatewaySingletonDecorator.js";
import { SingletonEditorFeature } from "./feature.js";

const ENTRY = { id: "entry-1#0001", entryId: "entry-1", values: {} } as unknown as CmsContentEntry;

const singletonModel = {
    modelId: "settings",
    singularApiName: "Settings",
    tags: ["singleEntry"],
    fields: []
} as unknown as CmsModel;

const regularModel = {
    modelId: "page",
    singularApiName: "Page",
    tags: [],
    fields: []
} as unknown as CmsModel;

const ERROR = { message: "Boom", code: "BOOM", data: null };

describe("singleton editor gateways", () => {
    let container: Container;
    let client: { execute: Mock };

    beforeEach(() => {
        container = new Container();
        client = {
            execute: vi.fn().mockResolvedValue({ content: { data: ENTRY, error: null } })
        };
        container.registerInstance(
            CmsGraphQLClient,
            client as unknown as CmsGraphQLClient.Interface
        );
        container.registerInstance(EntryGraphQLFields, {
            getSystemFields: () => "id",
            getValuesBlock: () => ""
        } as unknown as EntryGraphQLFields.Interface);
    });

    describe("GetLatestSingletonEntryGateway", () => {
        beforeEach(() => {
            container.register(GetLatestSingletonEntryGateway);
        });

        it("should send getLatest without variables and return the entry", async () => {
            const gateway = container.resolve(GatewayAbstraction);

            const result = await gateway.execute(singletonModel);

            const call = client.execute.mock.calls[0][0];
            expect(call.query).toContain("getSettingsLatest");
            expect(call.variables).toBeUndefined();
            expect(result.isOk()).toBe(true);
            expect(result.value).toEqual(ENTRY);
        });

        it("should map an error response to a failed result", async () => {
            client.execute.mockResolvedValue({ content: { data: null, error: ERROR } });
            const gateway = container.resolve(GatewayAbstraction);

            const result = await gateway.execute(singletonModel);

            expect(result.isFail()).toBe(true);
            expect(result.error.message).toBe("Boom");
            expect(result.error.code).toBe("BOOM");
        });
    });

    describe("GetEntryGatewaySingletonDecorator", () => {
        let decoratee: { execute: Mock };

        beforeEach(() => {
            decoratee = { execute: vi.fn().mockResolvedValue(ENTRY) };
            container.registerInstance(
                GetEntryGateway,
                decoratee as unknown as GetEntryGateway.Interface
            );
            container.registerDecorator(GetEntryGatewaySingletonDecorator);
        });

        it("should send getRevision with the revision for a singleton model", async () => {
            const gateway = container.resolve(GetEntryGateway);

            const entry = await gateway.execute({ model: singletonModel, id: ENTRY.id });

            const call = client.execute.mock.calls[0][0];
            expect(call.query).toContain("getSettingsRevision");
            expect(call.variables).toEqual({ revision: ENTRY.id });
            expect(decoratee.execute).not.toHaveBeenCalled();
            expect(entry).toEqual(ENTRY);
        });

        it("should include registered field selections in the query", async () => {
            container.registerInstance(GetEntryGraphQLFieldSelection, {
                getSelection: () => ["extraSelectionField"]
            });
            const gateway = container.resolve(GetEntryGateway);

            await gateway.execute({ model: singletonModel, id: ENTRY.id });

            expect(client.execute.mock.calls[0][0].query).toContain("extraSelectionField");
        });

        it("should throw when the response has an error", async () => {
            client.execute.mockResolvedValue({ content: { data: null, error: ERROR } });
            const gateway = container.resolve(GetEntryGateway);

            await expect(gateway.execute({ model: singletonModel, id: ENTRY.id })).rejects.toThrow(
                "Boom"
            );
        });

        it("should delegate to the decorated gateway for a regular model", async () => {
            const gateway = container.resolve(GetEntryGateway);

            const entry = await gateway.execute({ model: regularModel, id: ENTRY.id });

            expect(client.execute).not.toHaveBeenCalled();
            expect(decoratee.execute).toHaveBeenCalledWith({ model: regularModel, id: ENTRY.id });
            expect(entry).toEqual(ENTRY);
        });
    });

    describe("SingletonEditorFeature", () => {
        it("should decorate GetEntryGateway", async () => {
            GetEntryFeature.register(container);
            SingletonEditorFeature.register(container);

            const gateway = container.resolve(GetEntryGateway);
            await gateway.execute({ model: singletonModel, id: ENTRY.id });

            expect(client.execute.mock.calls[0][0].query).toContain("getSettingsRevision");
        });

        it("should resolve the latest use case", async () => {
            GetLatestSingletonEntryFeature.register(container);

            const useCase = container.resolve(GetLatestSingletonEntryUseCase);
            const result = await useCase.execute(singletonModel);

            expect(result.isOk()).toBe(true);
        });
    });
});
