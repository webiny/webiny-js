import type { ApolloClient } from "apollo-client";
import type { CmsErrorResponse } from "@webiny/app-headless-cms-common/types/index.js";
import zod from "zod";
import { schedulerEntrySchema } from "./schema/schedulerEntry.js";
import { createZodError } from "@webiny/utils/createZodError.js";
import gql from "graphql-tag";
import type { SchedulerEntry } from "@webiny/app-headless-cms-scheduler/types.js";
import { ScheduleType } from "@webiny/app-headless-cms-scheduler/types.js";
import type {
    ISchedulePublishActionExecuteParams,
    ISchedulePublishActionGateway,
    ISchedulePublishActionGatewayResponse
} from "@webiny/app-headless-cms-scheduler";
import { createSchedulerEntryFields } from "./graphql/fields.js";

const createSchedulePublishActionMutation = () => {
    return gql`
        mutation SchedulePublishAction($app: String!, $id: ID!, $scheduleFor: DateTime, $type: ScheduleRecordType!) {
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

interface SchedulerPublishGraphQLMutationVariables {
    app: string;
    id: string;
    scheduleFor: Date;
    type: ScheduleType.publish;
}

interface SchedulerPublishGraphQLMutationResponse {
    createScheduleAction: {
        data: SchedulerEntry | null;
        error: CmsErrorResponse | null;
    };
}

const schema = zod.object({
    data: schedulerEntrySchema
});

export class SchedulerPublishGraphQLGateway implements ISchedulePublishActionGateway {
    private readonly client: ApolloClient<any>;

    public constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    public async execute(
        params: ISchedulePublishActionExecuteParams
    ): Promise<ISchedulePublishActionGatewayResponse> {
        const { data: response, errors } = await this.client.mutate<
            SchedulerPublishGraphQLMutationResponse,
            SchedulerPublishGraphQLMutationVariables
        >({
            mutation: createSchedulePublishActionMutation(),
            variables: {
                app: params.app,
                id: params.id,
                scheduleFor: params.scheduleOn,
                type: ScheduleType.publish
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
            throw new Error(result.error?.message || "Could execute schedule publish action.");
        }

        const validated = await schema.safeParseAsync(result);
        if (!validated.success) {
            throw createZodError(validated.error);
        }
        return {
            item: validated.data.data
        };
    }
}
