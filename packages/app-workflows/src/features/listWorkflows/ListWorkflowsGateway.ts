import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { WORKFLOW_FIELDS, ERROR_FIELDS } from "~/features/graphqlFields.js";
import {
    ListWorkflowsGateway as GatewayAbstraction,
    type IListWorkflowsParams
} from "./abstractions.js";
import type { IWorkflow } from "~/types.js";

interface ListWorkflowsResponse {
    workflows: {
        listWorkflows: {
            data: IWorkflow[] | null;
            error: { message: string } | null;
        };
    };
}

const LIST_WORKFLOWS_QUERY = /* GraphQL */ `
    query ListWorkflows($where: ListWorkflowsWhereInput, $limit: Int, $sort: [ListWorkflowsSort!], $after: String) {
        workflows {
            listWorkflows(where: $where, limit: $limit, sort: $sort, after: $after) {
                data {
                    ${WORKFLOW_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

class ListWorkflowsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(params?: IListWorkflowsParams): Promise<IWorkflow[]> {
        const response = await this.client.execute<ListWorkflowsResponse>({
            query: LIST_WORKFLOWS_QUERY,
            variables: { where: params?.where, sort: ["createdOn_DESC"] }
        });

        const { data, error } = response.workflows.listWorkflows;

        if (error) {
            throw new Error(error.message);
        }

        return data || [];
    }
}

export const ListWorkflowsGateway = GatewayAbstraction.createImplementation({
    implementation: ListWorkflowsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
