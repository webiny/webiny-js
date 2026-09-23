import { makeAutoObservable } from "mobx";
import { runInAction } from "mobx";
import { LocalStorage } from "@webiny/app/features/localStorage";
import { AssumedRoleContext as Abstraction } from "./abstractions.js";

const LOCAL_STORAGE_KEY = "assumedRole";

/**
 * Holds the role or team being previewed, and survives a reload so a refresh mid-preview doesn't
 * quietly hand the user their real permissions back.
 */
class AssumedRoleContextImpl implements Abstraction.Interface {
    private value: Abstraction.Value | null;

    constructor(private localStorage: LocalStorage.Interface) {
        this.value = this.localStorage.get<Abstraction.Value>(LOCAL_STORAGE_KEY) ?? null;
        makeAutoObservable(this, {}, { autoBind: true });
    }

    get(): Abstraction.Value | null {
        return this.value;
    }

    set(value: Abstraction.Value | null): void {
        runInAction(() => {
            this.value = value;
        });

        if (value) {
            this.localStorage.set(LOCAL_STORAGE_KEY, value);
            return;
        }

        this.localStorage.remove(LOCAL_STORAGE_KEY);
    }
}

export const AssumedRoleContext = Abstraction.createImplementation({
    implementation: AssumedRoleContextImpl,
    dependencies: [LocalStorage]
});
