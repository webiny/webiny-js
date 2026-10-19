import { makeAutoObservable, reaction } from "mobx";
import type { IReactionDisposer } from "mobx";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/index.js";
import { ExtensionMenusPresenter as PresenterAbstraction } from "./abstractions.js";
import { AdminExtensionsGateway } from "~/admin/adminExtensions/features/gateway/abstractions.js";
import { toExtensionMenu } from "./toExtensionMenu.js";

class ExtensionMenusPresenterImpl implements PresenterAbstraction.Interface {
    private menus: PresenterAbstraction.Menu[] = [];
    private disposeReaction: IReactionDisposer | null = null;
    // Bumped by every load and sign-out, so a load that finishes late cannot bring old menus back.
    private generation = 0;

    constructor(
        private readonly identityContext: IdentityContext.Interface,
        private readonly gateway: AdminExtensionsGateway.Interface
    ) {
        makeAutoObservable<ExtensionMenusPresenterImpl, "disposeReaction" | "generation">(this, {
            disposeReaction: false,
            generation: false
        });
    }

    get vm(): PresenterAbstraction.ViewModel {
        return { menus: this.menus };
    }

    start(): void {
        if (this.disposeReaction) {
            return;
        }

        this.disposeReaction = reaction(
            () => this.identityContext.getIdentity().isAuthenticated,
            isAuthenticated => {
                if (isAuthenticated) {
                    void this.reload();
                    return;
                }
                this.clear();
            },
            { fireImmediately: true }
        );
    }

    stop(): void {
        this.disposeReaction?.();
        this.disposeReaction = null;
        this.clear();
    }

    async reload(): Promise<void> {
        this.generation++;
        const generation = this.generation;
        const menus: PresenterAbstraction.Menu[] = [];
        try {
            const extensions = await this.gateway.listEnabled("menu");
            for (const extension of extensions) {
                const menu = toExtensionMenu(extension);
                if (menu) {
                    menus.push(menu);
                }
            }
        } catch {
            // A failed load leaves the built-in sidebar as it is, which is the useful outcome.
        }
        if (generation === this.generation) {
            this.setMenus(menus);
        }
    }

    private clear(): void {
        this.generation++;
        this.setMenus([]);
    }

    private setMenus(menus: PresenterAbstraction.Menu[]): void {
        this.menus = menus;
    }
}

export const ExtensionMenusPresenter = PresenterAbstraction.createImplementation({
    implementation: ExtensionMenusPresenterImpl,
    dependencies: [IdentityContext, AdminExtensionsGateway]
});
