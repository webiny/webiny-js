import { makeAutoObservable } from "mobx";
import { reaction } from "mobx";
import { ListModelsUseCase } from "@webiny/app-headless-cms/features/model/listModels/abstractions.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import { createAppName } from "~/utils/appName.js";
import { CmsContentReviewsPresenter as Abstraction } from "./abstractions.js";
import type { CmsContentTypeOption } from "./abstractions.js";
import type { ContentType } from "./abstractions.js";
import type { ListedModel } from "./abstractions.js";
import { toContentTypes } from "./toContentTypes.js";

type PrivateMembers =
    | "listModels"
    | "notifications"
    | "identityContext"
    | "pending"
    | "stopWatching";

class CmsContentReviewsPresenterImpl implements Abstraction.Interface {
    private _loading = true;
    private _contentTypes: ContentType[] = [];
    // The signed-in user the model list was loaded for; a failed list leaves it empty to retry.
    private loadedFor: string | null = null;
    private pendingFor: string | null = null;
    private pending: Promise<void> | null = null;
    private stopWatching: (() => void) | null = null;

    constructor(
        private listModels: ListModelsUseCase.Interface,
        private notifications: Notifications.Interface,
        private identityContext: IdentityContext.Interface
    ) {
        makeAutoObservable<CmsContentReviewsPresenterImpl, PrivateMembers>(this, {
            listModels: false,
            notifications: false,
            identityContext: false,
            pending: false,
            stopWatching: false
        });
    }

    get vm(): Abstraction.ViewModel {
        const namespaces = this._contentTypes.map(contentType => {
            return createAppName(contentType);
        });
        const options: CmsContentTypeOption[] = this._contentTypes.map(contentType => {
            return { label: contentType.name, value: contentType.modelId };
        });

        return { loading: this._loading, namespaces, options };
    }

    /*
     * The model list needs a signed-in user: the presenter is mounted at the app root, before
     * sign-in completes. It loads once there is one and again when a user signs in after a failure.
     */
    init(): Promise<void> {
        if (!this.stopWatching) {
            this.stopWatching = reaction(
                () => this.signedInUserId(),
                userId => {
                    void this.loadFor(userId);
                }
            );
        }
        return this.loadFor(this.signedInUserId());
    }

    dispose(): void {
        if (this.stopWatching) {
            this.stopWatching();
        }
        this.stopWatching = null;
    }

    private signedInUserId(): string | null {
        const identity = this.identityContext.getIdentity();
        if (!identity.isAuthenticated) {
            return null;
        }
        return identity.id;
    }

    private loadFor(userId: string | null): Promise<void> {
        // No one is signed in yet: the API would refuse the list.
        if (userId === null) {
            return Promise.resolve();
        }
        if (this.loadedFor === userId) {
            return Promise.resolve();
        }
        // StrictMode runs effects twice; one list is in flight per user.
        if (this.pending && this.pendingFor === userId) {
            return this.pending;
        }
        this.pendingFor = userId;
        this.pending = this.load(userId);
        return this.pending;
    }

    private async load(userId: string): Promise<void> {
        try {
            const models = await this.listModels.execute();
            this.applyModels(userId, models);
        } catch (error) {
            this.applyFailure(userId, error);
        }
    }

    private applyModels(userId: string, models: ListedModel[]): void {
        // A newer user's list owns the state now.
        if (this.pendingFor !== userId) {
            return;
        }
        this.pending = null;
        this.pendingFor = null;
        this.loadedFor = userId;
        this._contentTypes = toContentTypes(models);
        this._loading = false;
    }

    private applyFailure(userId: string, error: unknown): void {
        if (this.pendingFor !== userId) {
            return;
        }
        this.pending = null;
        this.pendingFor = null;
        this._contentTypes = [];
        this._loading = false;
        console.error("[CmsContentReviewsPresenter] Could not load the content types.", error);
        // Without the model list the list has no namespaces to follow: say so once per attempt.
        this.notifications.error({
            title: "Could not load the content types",
            description: "Content Reviews will not update live. Reload the page to try again."
        });
    }
}

export const CmsContentReviewsPresenter = Abstraction.createImplementation({
    implementation: CmsContentReviewsPresenterImpl,
    dependencies: [ListModelsUseCase, Notifications, IdentityContext]
});
