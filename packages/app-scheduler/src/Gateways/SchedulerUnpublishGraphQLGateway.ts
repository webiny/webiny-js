import type { ApolloClient } from "apollo-client";
import type { CmsErrorResponse } from "@webiny/app-headless-cms-common/types/index.js";
import zod from "zod";
import { schedulerEntrySchema } from "./schema/schedulerEntry.js";
import { createZodError } from "@webiny/utils/createZodError.js";
import gql from "graphql-tag";
import type {
    IScheduleUnpublishActionExecuteParams,
    IScheduleUnpublishActionGateway
} from "@webiny/app-headless-cms-scheduler";
import type { SchedulerEntry } from "@webiny/app-headless-cms-scheduler/types.js";
import { ScheduleType } from "@webiny/app-headless-cms-scheduler/types.js";
import { createSchedulerEntryFields } from "./graphql/fields.js";

const createScheduleUnpublishActionMutation = () => {
    return gql`
        mutation ScheduleUnpublishAction($app: String!, $id: ID!, $scheduleFor: DateTime, $type: ScheduleRecordType!) {
            createScheduleAction(app: $app, id: $id, scheduleFor: $scheduleFor, type: $type) {
                data {
                    ${createSchedulerEntryFields()}
                }
                error {
                    message
                    code
                    data
                    stack
                }
            }
        }
    `;
};

interface SchedulerUnpublishGraphQLMutationVariables {
    app: string;
    id: string;
    scheduleFor: Date;
    type: ScheduleType.unpublish;
}

interface SchedulerUnpublishGraphQLMutationResponse {
    createScheduleAction: {
        data: SchedulerEntry | null;
        error: CmsErrorResponse | null;
    };
}

const schema = zod.object({
    data: schedulerEntrySchema
});

export class SchedulerUnpublishGraphQLGateway implements IScheduleUnpublishActionGateway {
    private readonly client: ApolloClient<any>;

    public constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    public async execute(params: IScheduleUnpublishActionExecuteParams) {
        const { data: response, errors } = await this.client.mutate<
            SchedulerUnpublishGraphQLMutationResponse,
            SchedulerUnpublishGraphQLMutationVariables
        >({
            mutation: createScheduleUnpublishActionMutation(),
            variables: {
                app: params.app,
                id: params.id,
                scheduleFor: params.scheduleOn,
                type: ScheduleType.unpublish
            },
            fetchPolicy: "no-cache"
        });

        const result = response?.createScheduleAction;
        if (!result || errors?.length) {
            console.error({
                errors
            });
            throw new Error("Network error while creating a schedule.");
        }

        if (!result.data) {
            throw new Error(result.error?.message || "Could execute schedule unpublish action.");
        }

        const validated = await schema.safeParseAsync(result);
        if (!validated.success) {
            const err = createZodError(validated.error);
            console.error(err);
            throw err;
        }
        return {
            item: validated.data.data
        };
    }
}
