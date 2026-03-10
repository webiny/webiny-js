import type { ApolloClient } from "apollo-client";
import type { CmsErrorResponse } from "~/types.js";
import gql from "graphql-tag";
import zod from "zod";
import { createZodError } from "@webiny/utils/createZodError.js";
import { wbSchedulerEntrySchema } from "./schema/wbSchedulerEntry.js";
import type {
    IWbSchedulerUnpublishExecuteParams,
    IWbSchedulerUnpublishGateway,
    IWbSchedulerUnpublishGatewayResponse
} from "~/Gateways/index.js";
import type { WbSchedulerEntry } from "~/types.js";
import { WB_SCHEDULE_RECORD_FIELDS } from "./graphql/fields.js";

const createWbSchedulerUnpublishMutation = () => {
    return gql`
        mutation CreateWbScheduleUnpublish($id: ID!, $scheduleFor: DateTime!) {
            websiteBuilder {
                createWbSchedule(id: $id, scheduleFor: $scheduleFor, type: unpublish) {
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

interface WbSchedulerUnpublishGraphQLMutationVariables {
    id: string;
    scheduleFor: Date;
}

interface WbSchedulerUnpublishGraphQLMutationResponse {
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

export class WbSchedulerUnpublishGraphQLGateway implements IWbSchedulerUnpublishGateway {
    private readonly client: ApolloClient<any>;

    public constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    public async execute(
        params: IWbSchedulerUnpublishExecuteParams
    ): Promise<IWbSchedulerUnpublishGatewayResponse> {
        const { data: response, errors } = await this.client.mutate<
            WbSchedulerUnpublishGraphQLMutationResponse,
            WbSchedulerUnpublishGraphQLMutationVariables
        >({
            mutation: createWbSchedulerUnpublishMutation(),
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
            throw new Error("Network error while creating a WB unpublish schedule.");
        }

        if (!result.data) {
            throw new Error(
                result.error?.message || "Could not schedule WB entry to be unpublished."
            );
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
