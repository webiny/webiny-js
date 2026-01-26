import { makeAutoObservable, runInAction } from "mobx";
import { TenantContext as Abstraction } from "./abstractions.js";
import { LocalStorageService } from "@webiny/app/features/localStorage";

const LOCAL_STORAGE_KEY = "tenantId";
const DEFAULT_TENANT = "root";

class TenantContextImpl implements Abstraction.Interface {
    private currentTenant: string | null = null;
    private changeCallbacks = new Set<(tenantId: string | null) => void>();

    constructor(private localStorage: LocalStorageService.Interface) {
        makeAutoObservable(this, {}, { autoBind: true });
        this.initialize();
    }

    private initialize(): void {
        const storedTenant = this.localStorage.get<string>(LOCAL_STORAGE_KEY) || DEFAULT_TENANT;
        this.currentTenant = storedTenant;
        this.localStorage.set(LOCAL_STORAGE_KEY, storedTenant);
    }

    getCurrentTenant(): string | null {
        return this.currentTenant;
    }

    setTenant(tenantId: string | null): void {
        const previousTenant = this.currentTenant;

        runInAction(() => {
            this.currentTenant = tenantId;
        });

        if (tenantId) {
            this.localStorage.set(LOCAL_STORAGE_KEY, tenantId);
        } else {
            this.localStorage.remove(LOCAL_STORAGE_KEY);
        }

        // Only notify if tenant actually changed
        if (previousTenant !== tenantId) {
            this.notifyListeners(tenantId);
        }
    }

    onTenantChange(callback: (tenantId: string | null) => void): () => void {
        this.changeCallbacks.add(callback);
        return () => {
            this.changeCallbacks.delete(callback);
        };
    }

    private notifyListeners(tenantId: string | null): void {
        this.changeCallbacks.forEach(callback => {
            try {
                callback(tenantId);
            } catch (error) {
                console.error("Tenant change callback error:", error);
            }
        });
    }
}

export const TenantContext = Abstraction.createImplementation({
    implementation: TenantContextImpl,
    dependencies: [LocalStorageService]
});
