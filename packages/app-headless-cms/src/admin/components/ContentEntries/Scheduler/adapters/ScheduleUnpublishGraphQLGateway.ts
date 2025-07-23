import type { ApolloClient } from "apollo-client";
import type { CmsErrorResponse, CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import zod from "zod";
import { scheduleEntrySchema } from "./schema/scheduleEntry.js";
import { createZodError } from "@webiny/utils/createZodError";
import gql from "graphql-tag";
import { ScheduleEntry, ScheduleType } from "@webiny/app-headless-cms-scheduler/types.js";
import type {
    IScheduleUnpublishGraphQLGateway,
    IScheduleUnpublishGraphQLMutationParams
} from "@webiny/app-headless-cms-scheduler/gateways/ScheduleUnpublishGraphQLGateway.js";

const createScheduleUnpublishMutation = () => {
    return gql`
        mutation ScheduleUnpublish($modelId: ID!, $id: ID!, $input: CmsCreateScheduleInput!) {
            createCmsSchedule(modelId: $modelId, id: $id, input: $input) {
                data {
                    id
                    targetId
                    model
                    scheduledBy {
                        id
                        displayName
                        type
                    }
                    publishOn
                    unpublishOn
                    type
                    title
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

interface ScheduleUnpublishGraphQLMutationVariables {
    modelId: string;
    id: string;
    input: {
        scheduleOn: Date;
        type: ScheduleType.unpublish;
    };
}

interface ScheduleUnpublishGraphQLMutationResponse {
    createCmsSchedule: {
        data: ScheduleEntry | null;
        error: CmsErrorResponse | null;
    };
}

const schema = zod.object({
    data: scheduleEntrySchema
});

export class ScheduleUnpublishGraphQLGateway implements IScheduleUnpublishGraphQLGateway {
    private readonly client: ApolloClient<any>;
    private readonly model: CmsModel;

    public constructor(client: ApolloClient<any>, model: CmsModel) {
        this.client = client;
        this.model = model;
    }

    public async execute(params: IScheduleUnpublishGraphQLMutationParams) {
        const { data: response, errors } = await this.client.query<
            ScheduleUnpublishGraphQLMutationResponse,
            ScheduleUnpublishGraphQLMutationVariables
        >({
            query: createScheduleUnpublishMutation(),
            variables: {
                modelId: params.modelId,
                id: params.id,
                input: {
                    scheduleOn: params.scheduleOn,
                    type: ScheduleType.unpublish
                }
            },
            fetchPolicy: "network-only"
        });

        const result = response.createCmsSchedule;
        if (!result || errors?.length) {
            console.error({
                errors
            });
            throw new Error("Network error while creating a schedule.");
        }

        if (!result.data) {
            throw new Error(result.error?.message || "Could not schedule entry to be unpublished.");
        }

        const validated = await schema.safeParseAsync(result.data);
        if (!validated.success) {
            throw createZodError(validated.error);
        }
        return {
            item: validated.data.data
        };
    }
}
