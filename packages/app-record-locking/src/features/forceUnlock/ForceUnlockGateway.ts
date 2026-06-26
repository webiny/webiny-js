import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { LOCK_RECORD_FIELDS, ERROR_FIELDS } from "~/features/graphqlFields.js";
import {
    ForceUnlockGateway as GatewayAbstraction,
    type IForceUnlockParams
} from "./abstractions.js";
import type { IRecordLockingError, IRecordLockingLockRecord } from "~/types.js";

interface ForceUnlockResponse {
    recordLocking: {
        unlockEntry: {
            data: IRecordLockingLockRecord | null;
            error: IRecordLockingError | null;
        };
    };
}

const FORCE_UNLOCK_MUTATION = /* GraphQL */ `
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

class ForceUnlockGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(params: IForceUnlockParams) {
        const response = await this.client.execute<ForceUnlockResponse>({
            query: FORCE_UNLOCK_MUTATION,
            variables: { id: params.id, type: params.type, force: true }
        });

        const { data, error } = response.recordLocking.unlockEntry;

        if (!data) {
            throw new Error(error?.message || "Failed to force unlock");
        }

        return data;
    }
}

export const ForceUnlockGateway = GatewayAbstraction.createImplementation({
    implementation: ForceUnlockGatewayImpl,
    dependencies: [MainGraphQLClient]
});
