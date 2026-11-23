import type { ApiSession } from "../../../support/apiSession.ts";
import { callGraphql, requireData } from "../../../support/callGraphql.ts";
import type { TestModel } from "../../../support/contentModel.ts";
import type { TestEntry } from "../../../support/entry.ts";

/** What the API answered to a publish: the error code when it refused, else null. */
export interface PublishAttempt {
    errorCode: string | null;
    errorMessage: string | null;
}

interface OperationError {
    code: string | null;
    message: string | null;
}

interface PublishEntryData {
    publishEntry: {
        error: OperationError | null;
    };
}

interface ScheduleActionData {
    scheduler: {
        scheduleAction: {
            error: OperationError | null;
        };
    };
}

const SCHEDULE_ACTION = /* GraphQL */ `
    mutation SchedulePublish($namespace: String!, $targetId: ID!, $scheduleFor: DateTime) {
        scheduler {
            scheduleAction(
                namespace: $namespace
                targetId: $targetId
                scheduleFor: $scheduleFor
                actionType: publish
            ) {
                error {
                    code
                    message
                }
            }
        }
    }
`;

const toAttempt = (error: OperationError | null | undefined): PublishAttempt => {
    return { errorCode: error?.code ?? null, errorMessage: error?.message ?? null };
};

/** Publishes the entry revision now, through `publish<Model>`. */
export const publishEntry = async (
    session: ApiSession,
    model: TestModel,
    entry: TestEntry
): Promise<PublishAttempt> => {
    const query = /* GraphQL */ `
        mutation PublishEntry($revision: ID!) {
            publishEntry: publish${model.singularApiName}(revision: $revision) {
                error {
                    code
                    message
                }
            }
        }
    `;
    const result = await callGraphql<PublishEntryData>(session, "cms/manage", query, {
        revision: entry.id
    });
    return toAttempt(requireData(result, `publish${model.singularApiName}`).publishEntry.error);
};

/** Schedules the entry revision's publish for a day from now, through the scheduler. */
export const schedulePublish = async (
    session: ApiSession,
    model: TestModel,
    entry: TestEntry
): Promise<PublishAttempt> => {
    const scheduleFor = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const result = await callGraphql<ScheduleActionData>(session, "graphql", SCHEDULE_ACTION, {
        namespace: `Cms/Entry/${model.modelId}`,
        targetId: entry.id,
        scheduleFor
    });
    return toAttempt(requireData(result, "scheduleAction").scheduler.scheduleAction.error);
};
