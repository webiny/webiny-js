import { makeAutoObservable } from "mobx";
import { observableRef } from "mobx";
import { reaction } from "mobx";
import type { IReactionDisposer } from "mobx";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/index.js";
import { EnabledExtensionsPresenter as PresenterAbstraction } from "./abstractions.js";
import { AdminExtensionsGateway } from "~/admin/adminExtensions/features/gateway/abstractions.js";
import { FieldRendererEvaluator } from "~/admin/adminExtensions/features/fieldRendererRuntime/abstractions.js";
import { GeneratedCmsFieldRenderers } from "~/admin/adminExtensions/features/cmsFieldRenderers/abstractions.js";
import type { AdminExtensionDto } from "~/shared/adminExtensions/types.js";
import type { AdminExtensionKind } from "~/shared/adminExtensions/constants.js";
import { toExtensionMenu } from "./toExtensionMenu.js";
import { toLoadedFieldRenderer } from "./toLoadedFieldRenderer.js";

class EnabledExtensionsPresenterImpl implements PresenterAbstraction.Interface {
    private menus: PresenterAbstraction.Menu[] = [];
    private fieldRenderers: PresenterAbstraction.FieldRenderer[] = [];
    private disposeReaction: IReactionDisposer | null = null;
    // Bumped by every load and sign-out, so a load that finishes late cannot bring old state back.
    private generation = 0;

    constructor(
        private readonly identityContext: IdentityContext.Interface,
        private readonly gateway: AdminExtensionsGateway.Interface,
        private readonly evaluator: FieldRendererEvaluator.Interface,
        private readonly cmsFieldRenderers: GeneratedCmsFieldRenderers.Interface
    ) {
        makeAutoObservable<
            EnabledExtensionsPresenterImpl,
            "disposeReaction" | "generation" | "menus" | "fieldRenderers"
        >(this, {
            disposeReaction: false,
            generation: false,
            menus: observableRef,
            // Holds React components, which must not be turned into observables.
            fieldRenderers: observableRef
        });
    }

    get vm(): PresenterAbstraction.ViewModel {
        return { menus: this.menus, fieldRenderers: this.fieldRenderers };
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

        const [menuExtensions, rendererExtensions] = await Promise.all([
            this.listEnabled("menu"),
            this.listEnabled("fieldRenderer")
        ]);
        if (generation !== this.generation) {
            return;
        }

        const menus: PresenterAbstraction.Menu[] = [];
        for (const extension of menuExtensions) {
            const menu = toExtensionMenu(extension);
            if (menu) {
                menus.push(menu);
            }
        }

        const fieldRenderers: PresenterAbstraction.FieldRenderer[] = [];
        for (const extension of rendererExtensions) {
            const renderer = toLoadedFieldRenderer(extension, this.evaluator);
            if (renderer) {
                fieldRenderers.push(renderer);
            }
        }

        this.setLoaded(menus, fieldRenderers);
    }

    private async listEnabled(kind: AdminExtensionKind): Promise<AdminExtensionDto[]> {
        try {
            return await this.gateway.listEnabled(kind);
        } catch {
            // A failed load leaves the built-in admin as it is, which is the useful outcome.
            return [];
        }
    }

    private clear(): void {
        this.generation++;
        this.setLoaded([], []);
    }

    private setLoaded(
        menus: PresenterAbstraction.Menu[],
        fieldRenderers: PresenterAbstraction.FieldRenderer[]
    ): void {
        this.menus = menus;
        this.fieldRenderers = fieldRenderers;
        // Before the form reads them: the CMS offers a renderer only once it is in its catalogue.
        this.cmsFieldRenderers.sync(fieldRenderers);
    }
}

export const EnabledExtensionsPresenter = PresenterAbstraction.createImplementation({
    implementation: EnabledExtensionsPresenterImpl,
    dependencies: [
        IdentityContext,
        AdminExtensionsGateway,
        FieldRendererEvaluator,
        GeneratedCmsFieldRenderers
    ]
});
