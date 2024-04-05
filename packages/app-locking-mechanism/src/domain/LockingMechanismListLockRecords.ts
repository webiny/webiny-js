import { ApolloClient } from "apollo-client";
import {
    ILockingMechanismListLockRecords,
    ILockingMechanismListLockRecordsParams,
    ILockingMechanismListLockRecordsResult
} from "./abstractions/ILockingMechanismListLockRecords";
import { ILockingMechanismClient } from "./abstractions/ILockingMechanismClient";
import { createLockingMechanismClient } from "./utils/createLockingMechanismClient";
import {
    createListLockRecords,
    ILockingMechanismListLockedRecordsResponse,
    ILockingMechanismListLockedRecordsVariables,
    LIST_LOCK_RECORDS
} from "~/domain/graphql/listLockRecords";
import { ILockingMechanismLockRecord } from "~/types";

interface Params {
    client: ILockingMechanismClient | ApolloClient<any>;
}

export class LockingMechanismListLockRecords implements ILockingMechanismListLockRecords {
    private readonly client: ILockingMechanismClient;

    public constructor(params: Params) {
        this.client = createLockingMechanismClient(params.client);
    }
    public async execute(
        params: ILockingMechanismListLockRecordsParams
    ): Promise<ILockingMechanismListLockRecordsResult> {
        const { where, sort, limit, after } = params;

        const result = await this.client.query<
            ILockingMechanismListLockedRecordsResponse,
            ILockingMechanismListLockedRecordsVariables
        >({
            query: LIST_LOCK_RECORDS,
            variables: {
                where,
                sort,
                limit,
                after
            }
        });
        if (!result.data?.lockingMechanism?.listLockRecords) {
            throw new Error("No data returned from server.");
        }

        return {
            data: result.data.lockingMechanism.listLockRecords.data,
            error: result.data.lockingMechanism.listLockRecords.error,
            meta: result.data.lockingMechanism.listLockRecords.meta
        };
    }
}
