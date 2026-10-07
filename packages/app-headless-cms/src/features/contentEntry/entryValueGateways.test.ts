import { describe, it, expect, vi, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import type { CmsContentEntry } from "~/types.js";
import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import { EntryGraphQLFields } from "./abstractions.js";
import { ValueTransformersFeature } from "./valueTransformers/feature.js";
import {
    formValues,
    graphQLInputValues,
    pageModel
} from "./valueTransformers/entryValueFixtures.js";
import { CreateEntryGateway as CreateEntryGatewayAbstraction } from "./createEntry/abstractions.js";
import { CreateEntryGateway } from "./createEntry/CreateEntryGateway.js";
import { UpdateEntryGateway as UpdateEntryGatewayAbstraction } from "./updateEntry/abstractions.js";
import { UpdateEntryGateway } from "./updateEntry/UpdateEntryGateway.js";
import { UpdateSingletonEntryGateway as UpdateSingletonEntryGatewayAbstraction } from "./singletonEntry/abstractions.js";
import { UpdateSingletonEntryGateway } from "./singletonEntry/UpdateSingletonEntryGateway.js";
import { CreateRevisionFromGateway as CreateRevisionFromGatewayAbstraction } from "./createRevisionFrom/abstractions.js";
import { CreateRevisionFromGateway } from "./createRevisionFrom/CreateRevisionFromGateway.js";

/**
 * Every gateway that sends entry values to the API must convert them from the form
 * shape into the GraphQL input shape. A gateway that skips this step breaks saving
 * entries with dynamic zone fields ("Field ... is not defined by type <Model>_<Field>Input").
 *
 * When you add a new gateway that sends entry values, add it to this list.
 */

const ENTRY = { id: "entry-1#0001", entryId: "entry-1", values: {} } as unknown as CmsContentEntry;

interface GatewayCase {
    name: string;
    register: (container: Container) => void;
    execute: (container: Container, data: Record<string, unknown>) => Promise<unknown>;
}

const cases: GatewayCase[] = [
    {
        name: "CreateEntryGateway",
        register: container => container.register(CreateEntryGateway),
        execute: (container, data) =>
            container.resolve(CreateEntryGatewayAbstraction).execute({ model: pageModel, data })
    },
    {
        name: "UpdateEntryGateway",
        register: container => container.register(UpdateEntryGateway),
        execute: (container, data) =>
            container
                .resolve(UpdateEntryGatewayAbstraction)
                .execute({ model: pageModel, revisionId: ENTRY.id, data })
    },
    {
        name: "UpdateSingletonEntryGateway",
        register: container => container.register(UpdateSingletonEntryGateway),
        execute: (container, data) =>
            container
                .resolve(UpdateSingletonEntryGatewayAbstraction)
                .execute({ model: pageModel, data })
    },
    {
        name: "CreateRevisionFromGateway",
        register: container => container.register(CreateRevisionFromGateway),
        execute: (container, data) =>
            container
                .resolve(CreateRevisionFromGatewayAbstraction)
                .execute({ model: pageModel, revisionId: ENTRY.id, data })
    }
];

describe.each(cases)("$name", ({ register, execute }) => {
    let container: Container;
    let client: { execute: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        container = new Container();
        client = {
            execute: vi.fn().mockResolvedValue({ content: { data: ENTRY, error: null } })
        };

        ValueTransformersFeature.register(container);
        container.registerInstance(
            CmsGraphQLClient,
            client as unknown as CmsGraphQLClient.Interface
        );
        container.registerInstance(EntryGraphQLFields, {
            getSystemFields: () => "id",
            getValuesBlock: () => ""
        } as unknown as EntryGraphQLFields.Interface);
        register(container);
    });

    it("should send dynamic zone values in the GraphQL input shape", async () => {
        await execute(container, { values: formValues });

        expect(client.execute).toHaveBeenCalledTimes(1);
        const { variables } = client.execute.mock.calls[0][0];
        expect(variables.data).toEqual({ values: graphQLInputValues });
    });

    it("should keep keys other than values in the payload", async () => {
        await execute(container, {
            values: formValues,
            wbyAco_location: { folderId: "root" }
        });

        const { variables } = client.execute.mock.calls[0][0];
        expect(variables.data.wbyAco_location).toEqual({ folderId: "root" });
    });

    it("should return the entry from the API response", async () => {
        await expect(execute(container, { values: formValues })).resolves.toEqual(ENTRY);
    });
});
