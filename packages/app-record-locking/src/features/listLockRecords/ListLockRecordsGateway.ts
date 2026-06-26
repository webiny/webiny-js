import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { LOCK_RECORD_FIELDS, ERROR_FIELDS } from "~/features/graphqlFields.js";
import {
    ListLockRecordsGateway as GatewayAbstraction,
    type IListLockRecordsParams
} from "./abstractions.js";
import type { IRecordLockingError, IRecordLockingLockRecord } from "~/types.js";

interface ListLockRecordsResponse {
    recordLocking: {
        listLockRecords: {
            data: IRecordLockingLockRecord[] | null;
            error: IRecordLockingError | null;
        };
    };
}

const LIST_LOCK_RECORDS_QUERY = /* GraphQL */ `
    query RecordLockingListLockedRecords(
        $where: RecordLockingListWhereInput
        $sort: [RecordLockingListSorter!]
        $limit: Int
        $after: String
    ) {
        recordLocking {
            listLockRecords(where: $where, sort: $sort, limit: $limit, after: $after) {
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

class ListLockRecordsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(params: IListLockRecordsParams) {
        const response = await this.client.execute<ListLockRecordsResponse>({
            query: LIST_LOCK_RECORDS_QUERY,
            variables: {
                where: params.where,
                limit: params.limit ?? 100
            }
        });

        const { data, error } = response.recordLocking.listLockRecords;

        if (error) {
            throw new Error(error.message);
        }

        return data || [];
    }
}

export const ListLockRecordsGateway = GatewayAbstraction.createImplementation({
    implementation: ListLockRecordsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
