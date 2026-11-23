import type { ApiSession } from "./apiSession.ts";
import { callGraphql, requireData } from "./callGraphql.ts";
import type { TestModel } from "./contentModel.ts";
import type { TestTeam } from "./team.ts";

interface WorkflowsError {
    code: string | null;
    message: string | null;
}

interface StoreWorkflowData {
    cms: {
        storeCmsEntryWorkflow: {
            data: { id: string } | null;
            error: WorkflowsError | null;
        };
    };
}

interface DeleteWorkflowData {
    cms: {
        deleteCmsEntryWorkflow: {
            error: WorkflowsError | null;
        };
    };
}

interface WorkflowModelRow {
    modelId: string;
    workflow: { id: string } | null;
}

interface ListWorkflowModelsData {
    cms: {
        listCmsEntryWorkflowModels: {
            data: WorkflowModelRow[] | null;
            error: WorkflowsError | null;
        };
    };
}

const STORE_WORKFLOW = /* GraphQL */ `
    mutation StoreWorkflow($data: WorkflowsWorkflowInput!) {
        cms {
            storeCmsEntryWorkflow(data: $data) {
                data {
                    id
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

const DELETE_WORKFLOW = /* GraphQL */ `
    mutation DeleteWorkflow($id: ID!) {
        cms {
            deleteCmsEntryWorkflow(id: $id) {
                error {
                    code
                    message
                }
            }
        }
    }
`;

const LIST_WORKFLOW_MODELS = /* GraphQL */ `
    query ListWorkflowModels($search: String) {
        cms {
            listCmsEntryWorkflowModels(search: $search, limit: 50) {
                data {
                    modelId
                    workflow {
                        id
                    }
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

/** A People step of a test workflow: its reviewing teams and whether the requester may pick. */
export interface PeopleStepInput {
    id: string;
    title: string;
    teams: TestTeam[];
    allowManualPick: boolean;
}

/**
 * Binds a new workflow with People steps, in order, to `model`. A step without an assignment rule
 * waits in its teams' pool. Returns the workflow's id.
 */
export const createPeopleWorkflow = async (
    session: ApiSession,
    model: TestModel,
    steps: PeopleStepInput[],
    runId: string
): Promise<string> => {
    const result = await callGraphql<StoreWorkflowData>(session, "graphql", STORE_WORKFLOW, {
        data: {
            // Alphanumeric, as the editor's own ids are.
            id: `e2ewf${runId}`,
            name: `E2E workflow ${runId}`,
            models: [`cms.${model.modelId}`],
            steps: steps.map(step => {
                return {
                    id: step.id,
                    title: step.title,
                    color: "",
                    type: "review",
                    notifications: [],
                    config: {
                        teams: step.teams.map(team => team.id),
                        assignment: {
                            strategy: "none",
                            allowManualPick: step.allowManualPick,
                            rules: []
                        }
                    }
                };
            })
        }
    });
    const stored = requireData(result, "storeCmsEntryWorkflow").cms.storeCmsEntryWorkflow;
    if (!stored.data) {
        throw new Error(`storeCmsEntryWorkflow failed: ${stored.error?.message}`);
    }
    return stored.data.id;
};

/** Binds a new workflow with one People step, reviewed by `team`, to `model`. Returns its id. */
export const createTestWorkflow = async (
    session: ApiSession,
    model: TestModel,
    team: TestTeam,
    runId: string
): Promise<string> => {
    const step: PeopleStepInput = {
        id: `e2estep${runId}`,
        title: "Editorial review",
        teams: [team],
        allowManualPick: false
    };
    return createPeopleWorkflow(session, model, [step], runId);
};

/** The id of the workflow bound to `model`, or null when it has none. */
export const findModelWorkflowId = async (
    session: ApiSession,
    model: TestModel
): Promise<string | null> => {
    const result = await callGraphql<ListWorkflowModelsData>(
        session,
        "graphql",
        LIST_WORKFLOW_MODELS,
        { search: model.name }
    );
    const listed = requireData(result, "listCmsEntryWorkflowModels").cms.listCmsEntryWorkflowModels;
    if (!listed.data) {
        throw new Error(`listCmsEntryWorkflowModels failed: ${listed.error?.message}`);
    }
    const row = listed.data.find(item => item.modelId === model.modelId);
    return row?.workflow?.id ?? null;
};

/** Deletes the workflow. Returns the error message, or null when it is gone. */
export const deleteTestWorkflow = async (
    session: ApiSession,
    workflowId: string
): Promise<string | null> => {
    const result = await callGraphql<DeleteWorkflowData>(session, "graphql", DELETE_WORKFLOW, {
        id: workflowId
    });
    return (
        result.errors?.[0]?.message ??
        result.data?.cms.deleteCmsEntryWorkflow.error?.message ??
        null
    );
};
