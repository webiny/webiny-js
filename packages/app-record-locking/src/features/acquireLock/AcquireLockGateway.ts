import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { LOCK_RECORD_FIELDS, ERROR_FIELDS } from "~/features/graphqlFields.js";
import {
    AcquireLockGateway as GatewayAbstraction,
    type IAcquireLockParams
} from "./abstractions.js";
import type { IRecordLockingError, IRecordLockingLockRecord } from "~/types.js";

interface AcquireLockResponse {
    recordLocking: {
        updateEntryLock: {
            data: IRecordLockingLockRecord | null;
            error: IRecordLockingError | null;
        };
    };
}

const ACQUIRE_LOCK_MUTATION = /* GraphQL */ `
    mutation RecordLockingUpdateEntryLock($id: ID!, $type: String!) {
        recordLocking {
            updateEntryLock(id: $id, type: $type) {
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

class AcquireLockGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(params: IAcquireLockParams) {
        const response = await this.client.execute<AcquireLockResponse>({
            query: ACQUIRE_LOCK_MUTATION,
            variables: { id: params.id, type: params.type }
        });

        const { data, error } = response.recordLocking.updateEntryLock;

        if (!data) {
            throw new Error(error?.message || "Failed to acquire lock");
        }

        return data;
    }
}

export const AcquireLockGateway = GatewayAbstraction.createImplementation({
    implementation: AcquireLockGatewayImpl,
    dependencies: [MainGraphQLClient]
});
