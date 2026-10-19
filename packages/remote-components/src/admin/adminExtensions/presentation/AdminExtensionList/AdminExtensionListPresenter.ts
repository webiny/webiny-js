import { makeAutoObservable } from "mobx";
import { AdminExtensionListPresenter as PresenterAbstraction } from "./abstractions.js";
import { AdminExtensionsGateway } from "~/admin/adminExtensions/features/gateway/abstractions.js";
import { ExtensionMenusPresenter } from "~/admin/adminExtensions/presentation/ExtensionMenus/abstractions.js";
import type { AdminExtensionDto } from "~/shared/adminExtensions/types.js";
import type { AdminExtensionKind } from "~/shared/adminExtensions/constants.js";

const KIND_LABELS: Record<AdminExtensionKind, string> = {
    menu: "Menu item",
    fieldRenderer: "Field renderer"
};

function toMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

class AdminExtensionListPresenterImpl implements PresenterAbstraction.Interface {
    private extensions: AdminExtensionDto[] = [];
    private loading = false;
    private error: string | null = null;
    private busyIds = new Set<string>();

    constructor(
        private readonly gateway: AdminExtensionsGateway.Interface,
        private readonly menus: ExtensionMenusPresenter.Interface
    ) {
        makeAutoObservable(this);
    }

    get vm(): PresenterAbstraction.ViewModel {
        return {
            loading: this.loading,
            error: this.error,
            rows: this.extensions.map(extension => ({
                id: extension.id,
                label: extension.label,
                name: extension.name,
                kindLabel: KIND_LABELS[extension.kind] ?? extension.kind,
                description: extension.description,
                enabled: extension.enabled,
                savedOn: extension.savedOn,
                busy: this.busyIds.has(extension.id)
            }))
        };
    }

    async load(): Promise<void> {
        this.startLoading();
        try {
            const extensions = await this.gateway.list();
            this.setExtensions(extensions);
        } catch (error) {
            this.setError(toMessage(error));
        }
    }

    async setEnabled(id: string, enabled: boolean): Promise<void> {
        this.setBusy(id, true);
        try {
            const updated = await this.gateway.setEnabled(id, enabled);
            this.replace(updated);
            await this.menus.reload();
        } catch (error) {
            this.setError(toMessage(error));
        } finally {
            this.setBusy(id, false);
        }
    }

    async delete(id: string): Promise<void> {
        this.setBusy(id, true);
        try {
            await this.gateway.delete(id);
            this.remove(id);
            await this.menus.reload();
        } catch (error) {
            this.setError(toMessage(error));
        } finally {
            this.setBusy(id, false);
        }
    }

    private startLoading(): void {
        this.loading = true;
        this.error = null;
    }

    private setExtensions(extensions: AdminExtensionDto[]): void {
        this.extensions = extensions;
        this.loading = false;
    }

    private setError(message: string): void {
        this.error = message;
        this.loading = false;
    }

    private setBusy(id: string, busy: boolean): void {
        if (busy) {
            this.busyIds.add(id);
        } else {
            this.busyIds.delete(id);
        }
    }

    private replace(updated: AdminExtensionDto): void {
        this.extensions = this.extensions.map(extension => {
            return extension.id === updated.id ? updated : extension;
        });
    }

    private remove(id: string): void {
        this.extensions = this.extensions.filter(extension => extension.id !== id);
    }
}

export const AdminExtensionListPresenter = PresenterAbstraction.createImplementation({
    implementation: AdminExtensionListPresenterImpl,
    dependencies: [AdminExtensionsGateway, ExtensionMenusPresenter]
});
