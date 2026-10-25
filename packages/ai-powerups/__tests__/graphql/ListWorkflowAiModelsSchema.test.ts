import { describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { ConfiguredAiModelsService } from "~/api/features/ConfiguredAiModels/index.js";
import type { ConfiguredAiModel } from "~/api/features/ConfiguredAiModels/index.js";
import { ListWorkflowAiModelsFeature } from "~/api/features/WorkflowReview/ListWorkflowAiModels/feature.js";
import { ListWorkflowAiModelsSchema } from "~/api/graphql/ListWorkflowAiModelsSchema.js";
import {
    registerFakeWorkflowsAccess,
    type FakeWorkflowsAccessOptions
} from "~tests/__helpers/FakeWorkflowsAccess.js";
import { composeSchema } from "~tests/__helpers/composeSchema.js";
import { registerRecordingLogger } from "~tests/__helpers/RecordingLogger.js";

/** What `WorkflowsSchemaFactory` provides and `ListWorkflowAiModelsSchema` extends (R176). */
const WORKFLOWS_STUB = /* GraphQL */ `
    type WorkflowsError {
        code: String
        message: String
        data: JSON
        stack: String
    }

    type WorkflowsQuery {
        _stub: String
    }
`;

const ROWS: ConfiguredAiModel[] = [
    {
        id: "anthropic/claude-a",
        name: "Claude A",
        providerId: "anthropic",
        providerName: "Anthropic"
    }
];

interface ListResponse {
    data: ConfiguredAiModel[] | null;
    error: { code: string; message: string } | null;
}

const run = async (
    access: FakeWorkflowsAccessOptions = {},
    list: () => Promise<Result<ConfiguredAiModel[], Error>> = async () => Result.ok(ROWS)
) => {
    const container = new Container();
    ListWorkflowAiModelsFeature.register(container);
    container.register(ListWorkflowAiModelsSchema);
    container.registerInstance(ConfiguredAiModelsService, {
        list,
        findConnection: async () => Result.ok(null)
    });
    registerRecordingLogger(container);
    registerFakeWorkflowsAccess(container, access);
    const { resolvers, schema } = await composeSchema(container, WORKFLOWS_STUB);
    const resolver = resolvers.WorkflowsQuery.listAiModels;
    const response = (await resolver({}, {}, { container }, {})) as ListResponse;
    return { response, schema };
};

describe("WorkflowsQuery.listAiModels (R176)", () => {
    it("adds the field and the row type to WorkflowsQuery", async () => {
        const { schema } = await run();

        const field = (schema.getType("WorkflowsQuery") as any).getFields().listAiModels;
        expect(String(field.type)).toBe("WorkflowsAiModelListResponse!");
        expect(
            Object.keys((schema.getType("WorkflowsAiModelListResponse") as any).getFields())
        ).toEqual(["data", "error"]);
    });

    it("answers the rows of the use case", async () => {
        const { response } = await run();

        expect(response).toEqual({ data: ROWS, error: null });
    });

    it("answers an empty list when no model has a connection", async () => {
        const { response } = await run({}, async () => Result.ok([]));

        expect(response).toEqual({ data: [], error: null });
    });

    it("answers the refusal for a user without editor", async () => {
        const { response } = await run({ canEdit: false });

        expect(response.data).toBeNull();
        expect(response.error).toMatchObject({
            code: "Workflows/NotAuthorized",
            message: "You are not allowed to list AI models."
        });
    });

    it("answers the fixed persistence text for a failed model read, never a raw error", async () => {
        const { response } = await run({}, async () =>
            Result.fail(new Error("Failed to list the configured AI models."))
        );

        expect(response.data).toBeNull();
        expect(response.error).toMatchObject({
            code: "Workflows/Workflow/Persistence",
            message: "The workflow could not be read or saved."
        });
    });
});
