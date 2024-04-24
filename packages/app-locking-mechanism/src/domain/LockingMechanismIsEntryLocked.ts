import {
    ILockingMechanismIsEntryLocked,
    ILockingMechanismIsEntryLockedParams,
    ILockingMechanismIsEntryLockedResult
} from "~/domain/abstractions/ILockingMechanismIsEntryLocked";
import { ILockingMechanismClient } from "./abstractions/ILockingMechanismClient";
import {
    ILockingMechanismIsEntryLockedResponse,
    ILockingMechanismIsEntryLockedVariables,
    IS_ENTRY_LOCKED_QUERY
} from "~/domain/graphql/isEntryLocked";

interface Params {
    client: ILockingMechanismClient;
}

export class LockingMechanismIsEntryLocked implements ILockingMechanismIsEntryLocked {
    private readonly client: ILockingMechanismClient;

    public constructor(params: Params) {
        this.client = params.client;
    }
    public async execute(
        params: ILockingMechanismIsEntryLockedParams
    ): Promise<ILockingMechanismIsEntryLockedResult> {
        try {
            const result = await this.client.query<
                ILockingMechanismIsEntryLockedResponse,
                ILockingMechanismIsEntryLockedVariables
            >({
                query: IS_ENTRY_LOCKED_QUERY,
                variables: params
            });
            return !!result.data.lockingMechanism.isEntryLocked.data;
        } catch {
            return false;
        }
    }
}
