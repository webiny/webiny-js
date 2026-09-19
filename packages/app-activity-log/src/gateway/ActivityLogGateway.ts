import { createAbstraction } from "@webiny/feature/admin";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import type { TimelineRecord } from "~/timeline/types.js";

export interface IListActivityGatewayParams {
    targetType: string;
    targetId: string;
    modelId: string;
    revision?: string;
    actorId?: string;
    limit?: number;
    after?: string | null;
}

export interface IListActivityGatewayResult {
    records: TimelineRecord[];
    /** Opaque. Handed back verbatim; never parsed. */
    cursor: string | null;
    hasMore: boolean;
    error: { message: string; code: string | null } | null;
}

export interface IActivityLogGateway {
    list(params: IListActivityGatewayParams): Promise<IListActivityGatewayResult>;
}

export const ActivityLogGateway = createAbstraction<IActivityLogGateway>(
    "ActivityLog/Admin/Gateway"
);

export namespace ActivityLogGateway {
    export type Interface = IActivityLogGateway;
    export type Params = IListActivityGatewayParams;
    export type Result = IListActivityGatewayResult;
}

const LIST_ACTIVITY_QUERY = /* GraphQL */ `
    query ListActivityLog(
        $targetType: String!
        $targetId: String!
        $modelId: String!
        $revision: String
        $actorId: String
        $limit: Int
        $after: String
    ) {
        listActivityLog(
            targetType: $targetType
            targetId: $targetId
            modelId: $modelId
            revision: $revision
            actorId: $actorId
            limit: $limit
            after: $after
        ) {
            data {
                id
                targetType
                targetId
                revision
                timestamp
                actor {
                    id
                    type
                    displayName
                }
                action
                source
                correlationId
                changeset {
                    path
                    label
                    operation
                }
                truncated
                subject {
                    id
                    label
                }
                hasNote
            }
            meta {
                cursor
                hasMoreItems
            }
            error {
                message
                code
            }
        }
    }
`;

interface ListActivityResponse {
    listActivityLog: {
        data: TimelineRecord[] | null;
        meta: { cursor: string | null; hasMoreItems: boolean } | null;
        error: { message: string; code: string | null } | null;
    };
}

/**
 * The only place the timeline talks to the API.
 *
 * Kept separate from the hook so the hook can be tested against a fake gateway without a GraphQL
 * client, and so a design handover replacing the components cannot accidentally take the query
 * with it.
 */
class ActivityLogGatewayImpl implements ActivityLogGateway.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async list(params: IListActivityGatewayParams): Promise<IListActivityGatewayResult> {
        const response = await this.client.execute<ListActivityResponse>({
            query: LIST_ACTIVITY_QUERY,
            variables: {
                targetType: params.targetType,
                targetId: params.targetId,
                modelId: params.modelId,
                revision: params.revision ?? null,
                actorId: params.actorId ?? null,
                limit: params.limit ?? null,
                after: params.after ?? null
            }
        });

        const result = response.listActivityLog;

        return {
            records: result?.data ?? [],
            cursor: result?.meta?.cursor ?? null,
            hasMore: result?.meta?.hasMoreItems === true,
            error: result?.error ?? null
        };
    }
}

export const ActivityLogGatewayImplementation = ActivityLogGateway.createImplementation({
    implementation: ActivityLogGatewayImpl,
    dependencies: [MainGraphQLClient]
});
