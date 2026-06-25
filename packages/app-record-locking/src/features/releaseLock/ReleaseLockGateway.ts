import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { LOCK_RECORD_FIELDS, ERROR_FIELDS } from "~/features/graphqlFields.js";
import {
    ReleaseLockGateway as GatewayAbstraction,
    type IReleaseLockParams
} from "./abstractions.js";
import type { IRecordLockingError, IRecordLockingLockRecord } from "~/types.js";

interface ReleaseLockResponse {
    recordLocking: {
        unlockEntry: {
            data: IRecordLockingLockRecord | null;
            error: IRecordLockingError | null;
        };
    };
}

const RELEASE_LOCK_MUTATION = /* GraphQL */ `
    mutation RecordLockingUnlockEntry($id: ID!, $type: String!, $force: Boolean) {
        recordLocking {
            unlockEntry(id: $id, type: $type, force: $force) {
                data {
                    ${LOCK_RECORD_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

class ReleaseLockGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(params: IReleaseLockParams) {
        const response = await this.client.execute<ReleaseLockResponse>({
            query: RELEASE_LOCK_MUTATION,
            variables: { id: params.id, type: params.type, force: false }
        });

        const { data, error } = response.recordLocking.unlockEntry;

        if (!data) {
            throw new Error(error?.message || "Failed to release lock");
        }

        return data;
    }
}

export const ReleaseLockGateway = GatewayAbstraction.createImplementation({
    implementation: ReleaseLockGatewayImpl,
    dependencies: [MainGraphQLClient]
});
