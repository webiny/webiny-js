import type { ApolloClient } from "apollo-client";
import type { CmsErrorResponse } from "~/types.js";
import gql from "graphql-tag";
import zod from "zod";
import { createZodError } from "@webiny/utils/createZodError.js";
import { wbSchedulerEntrySchema } from "./schema/wbSchedulerEntry.js";
import type {
    IWbSchedulerPublishExecuteParams,
    IWbSchedulerPublishGateway,
    IWbSchedulerPublishGatewayResponse
} from "~/Gateways/index.js";
import type { WbSchedulerEntry } from "~/types.js";
import { WB_SCHEDULE_RECORD_FIELDS } from "./graphql/fields.js";

const createWbSchedulerPublishMutation = () => {
    return gql`
        mutation CreateWbSchedulePublish($id: ID!, $scheduleFor: DateTime!) {
            websiteBuilder {
                createWbSchedule(id: $id, scheduleFor: $scheduleFor, type: publish) {
                    data {
                        ${WB_SCHEDULE_RECORD_FIELDS}
                    }
                    error {
                        code
                        message
                        data
                    }
                }
            }
        }
    `;
};

interface WbSchedulerPublishGraphQLMutationVariables {
    id: string;
    scheduleFor: Date;
}

interface WbSchedulerPublishGraphQLMutationResponse {
    websiteBuilder: {
        createWbSchedule: {
            data: WbSchedulerEntry | null;
            error: CmsErrorResponse | null;
        };
    };
}

const schema = zod.object({
    data: wbSchedulerEntrySchema
});

export class WbSchedulerPublishGraphQLGateway implements IWbSchedulerPublishGateway {
    private readonly client: ApolloClient<any>;

    public constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    public async execute(
        params: IWbSchedulerPublishExecuteParams
    ): Promise<IWbSchedulerPublishGatewayResponse> {
        const { data: response, errors } = await this.client.mutate<
            WbSchedulerPublishGraphQLMutationResponse,
            WbSchedulerPublishGraphQLMutationVariables
        >({
            mutation: createWbSchedulerPublishMutation(),
            variables: {
                id: params.id,
                scheduleFor: params.scheduleOn
            },
            fetchPolicy: "no-cache"
        });

        const result = response?.websiteBuilder.createWbSchedule;
        if (!result || errors?.length) {
            console.error({
                errors
            });
            throw new Error("Network error while creating a WB publish schedule.");
        }

        if (!result.data) {
            throw new Error(
                result.error?.message || "Could not schedule WB entry to be published."
            );
        }

        const validated = await schema.safeParseAsync(result);
        if (!validated.success) {
            console.error(validated.error);
            throw createZodError(validated.error);
        }

        return {
            item: validated.data.data
        };
    }
}
