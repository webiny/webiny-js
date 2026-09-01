import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { LOCK_RECORD_FIELDS, ERROR_FIELDS } from "~/features/graphqlFields.js";
import {
    CheckLockStatusGateway as GatewayAbstraction,
    type ICheckLockStatusParams
} from "./abstractions.js";
import type { IRecordLockingError, IRecordLockingLockRecord } from "~/types.js";

interface CheckLockStatusResponse {
    recordLocking: {
        getLockedEntryLockRecord: {
            data: IRecordLockingLockRecord | null;
            error: IRecordLockingError | null;
        };
    };
}

const CHECK_LOCK_STATUS_QUERY = /* GraphQL */ `
    query RecordLockingGetLockedEntryLockRecord($id: ID!, $type: String!) {
        recordLocking {
            getLockedEntryLockRecord(id: $id, type: $type) {
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

class CheckLockStatusGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(params: ICheckLockStatusParams) {
        const response = await this.client.execute<CheckLockStatusResponse>({
            query: CHECK_LOCK_STATUS_QUERY,
            variables: { id: params.id, type: params.type }
        });

        const { data, error } = response.recordLocking.getLockedEntryLockRecord;

        if (error) {
            throw new Error(error.message);
        }

        return data;
    }
}

export const CheckLockStatusGateway = GatewayAbstraction.createImplementation({
    implementation: CheckLockStatusGatewayImpl,
    dependencies: [MainGraphQLClient]
});
