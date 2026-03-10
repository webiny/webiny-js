import type { ApolloClient } from "apollo-client";
import type { CmsErrorResponse } from "~/types.js";
import gql from "graphql-tag";
import zod from "zod";
import { createZodError } from "@webiny/utils/createZodError.js";
import { wbSchedulerEntrySchema } from "./schema/wbSchedulerEntry.js";
import type { IWbSchedulerGetExecuteParams, IWbSchedulerGetGateway } from "~/Gateways/index.js";
import type { WbSchedulerEntry } from "~/types.js";
import { WB_SCHEDULE_RECORD_FIELDS } from "./graphql/fields.js";

const createWbSchedulerGetQuery = () => {
    return gql`
        query GetWbSchedule($id: ID!) {
            websiteBuilder {
                getWbSchedule(id: $id) {
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

interface WbSchedulerGetGraphQLQueryVariables {
    id: string;
}

interface WbSchedulerGetGraphQLQueryResponse {
    websiteBuilder: {
        getWbSchedule: {
            data: WbSchedulerEntry | null;
            error: CmsErrorResponse | null;
        };
    };
}

const schema = zod.object({
    data: wbSchedulerEntrySchema
});

export class WbSchedulerGetGraphQLGateway implements IWbSchedulerGetGateway {
    private readonly client: ApolloClient<any>;

    public constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    public async execute(params: IWbSchedulerGetExecuteParams) {
        const { data: response, errors } = await this.client.query<
            WbSchedulerGetGraphQLQueryResponse,
            WbSchedulerGetGraphQLQueryVariables
        >({
            query: createWbSchedulerGetQuery(),
            variables: {
                id: params.id
            },
            fetchPolicy: "network-only"
        });

        const result = response.websiteBuilder.getWbSchedule;
        if (!result || errors?.length) {
            console.error({
                errors
            });
            throw new Error("Network error while getting WB schedule entry.");
        } else if (result.error) {
            console.error({
                error: result.error
            });
            throw new Error(result.error.message || "Could not fetch scheduled WB entry.");
        } else if (!result.data) {
            return null;
        }

        const validated = await schema.safeParseAsync(result);
        if (!validated.success) {
            const err = createZodError(validated.error);
            console.error(err);
            throw err;
        }

        return validated.data.data;
    }
}
