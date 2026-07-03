import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { WORKFLOW_STATE_FIELDS, ERROR_FIELDS, META_FIELDS } from "~/features/graphqlFields.js";
import {
    ListWorkflowStatesGateway as GatewayAbstraction,
    type IListWorkflowStatesParams,
    type IListWorkflowStatesResult,
    type ListWorkflowStatesVariant
} from "./abstractions.js";
import type { IGenericMeta, IWorkflowState } from "~/types.js";

interface ListWorkflowStatesResponse {
    workflows: {
        listWorkflowStates: {
            data: IWorkflowState[] | null;
            meta: IGenericMeta | null;
            error: { message: string } | null;
        };
    };
}

const LIST_WORKFLOW_STATES_QUERY = /* GraphQL */ `
    query ListWorkflowStates($where: ListWorkflowStatesWhereInput, $limit: Int, $sort: [ListWorkflowStatesSort!], $after: String) {
        workflows {
            listWorkflowStates(where: $where, limit: $limit, sort: $sort, after: $after) {
                data {
                    ${WORKFLOW_STATE_FIELDS}
                }
                meta {
                    ${META_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

const LIST_OWN_WORKFLOW_STATES_QUERY = /* GraphQL */ `
    query ListOwnWorkflowStates($where: ListWorkflowStatesWhereInput, $limit: Int, $sort: [ListWorkflowStatesSort!], $after: String) {
        workflows {
            listWorkflowStates: listOwnWorkflowStates(where: $where, limit: $limit, sort: $sort, after: $after) {
                data {
                    ${WORKFLOW_STATE_FIELDS}
                }
                meta {
                    ${META_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

const LIST_REQUESTED_WORKFLOW_STATES_QUERY = /* GraphQL */ `
    query ListRequestedWorkflowStates($where: ListWorkflowStatesWhereInput, $limit: Int, $sort: [ListWorkflowStatesSort!], $after: String) {
        workflows {
            listWorkflowStates: listRequestedWorkflowStates(where: $where, limit: $limit, sort: $sort, after: $after) {
                data {
                    ${WORKFLOW_STATE_FIELDS}
                }
                meta {
                    ${META_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

const QUERIES: Record<ListWorkflowStatesVariant, string> = {
    all: LIST_WORKFLOW_STATES_QUERY,
    own: LIST_OWN_WORKFLOW_STATES_QUERY,
    requested: LIST_REQUESTED_WORKFLOW_STATES_QUERY
};

class ListWorkflowStatesGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(
        params?: IListWorkflowStatesParams,
        variant: ListWorkflowStatesVariant = "all"
    ): Promise<IListWorkflowStatesResult> {
        const response = await this.client.execute<ListWorkflowStatesResponse>({
            query: QUERIES[variant],
            variables: {
                where: params?.where,
                limit: params?.limit,
                sort: params?.sort || ["createdOn_DESC"],
                after: params?.after
            }
        });

        const { data, meta, error } = response.workflows.listWorkflowStates;

        if (error) {
            throw new Error(error.message);
        }

        return { data: data || [], meta };
    }
}

export const ListWorkflowStatesGateway = GatewayAbstraction.createImplementation({
    implementation: ListWorkflowStatesGatewayImpl,
    dependencies: [MainGraphQLClient]
});
