import { computed, makeAutoObservable, runInAction } from "mobx";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import {
    CreateLayoutRevisionFromUseCase,
    DeleteLayoutRevisionUseCase,
    GetLayoutRevisionsUseCase,
    getLayoutErrorMessage,
    type Layout,
    LayoutsRepository,
    PublishLayoutUseCase,
    UnpublishLayoutUseCase
} from "~/features/layouts/index.js";
import { toTitleCaseLabel } from "~/shared/toTitleCaseLabel.js";
import { LayoutRevisionsPresenter as PresenterAbstraction } from "./abstractions.js";

export const getRevisionLabel = (revision: Pick<Layout, "version" | "status">) => {
    return `v${revision.version} (${toTitleCaseLabel(revision.status)})`;
};

class LayoutRevisionsPresenterImpl implements PresenterAbstraction.Interface {
    private entryId: string | null = null;
    private loading = false;
    private mutating = false;
    private drawerOpen = false;

    constructor(
        private repository: LayoutsRepository.Interface,
        private getRevisions: GetLayoutRevisionsUseCase.Interface,
        private publishLayout: PublishLayoutUseCase.Interface,
        private unpublishLayout: UnpublishLayoutUseCase.Interface,
        private createLayoutRevisionFrom: CreateLayoutRevisionFromUseCase.Interface,
        private deleteLayoutRevision: DeleteLayoutRevisionUseCase.Interface,
        private permissions: WbPermissions.Interface,
        private notifications: Notifications.Interface
    ) {
        makeAutoObservable<
            LayoutRevisionsPresenterImpl,
            | "repository"
            | "getRevisions"
            | "publishLayout"
            | "unpublishLayout"
            | "createLayoutRevisionFrom"
            | "deleteLayoutRevision"
            | "permissions"
            | "notifications"
        >(
            this,
            {
                vm: computed,
                repository: false,
                getRevisions: false,
                publishLayout: false,
                unpublishLayout: false,
                createLayoutRevisionFrom: false,
                deleteLayoutRevision: false,
                permissions: false,
                notifications: false
            },
            { autoBind: true }
        );
    }

    get vm(): PresenterAbstraction.ViewModel {
        const revisions = this.entryId ? this.repository.getLoadedRevisions(this.entryId) : [];

        return {
            revisions: revisions.map(revision => this.getItemVm(revision)),
            loading: this.loading,
            mutating: this.mutating,
            drawerOpen: this.drawerOpen
        };
    }

    init(entryId: string) {
        if (this.entryId === entryId) {
            return;
        }

        this.entryId = entryId;
        this.drawerOpen = false;
        void this.load(entryId);
    }

    openDrawer(open: boolean) {
        this.drawerOpen = open;
    }

    publish(revision: PresenterAbstraction.RevisionRef) {
        return this.run(
            () => this.publishLayout.execute(revision.id),
            `Revision #${revision.version} was published.`,
            "Could not publish the revision"
        );
    }

    unpublish(revision: PresenterAbstraction.RevisionRef) {
        return this.run(
            () => this.unpublishLayout.execute(revision.id),
            `Revision #${revision.version} was unpublished.`,
            "Could not unpublish the revision"
        );
    }

    createRevisionFrom(revision: PresenterAbstraction.RevisionRef) {
        return this.run(
            () => this.createLayoutRevisionFrom.execute(revision.id),
            "A new revision was created.",
            "Could not create a new revision"
        );
    }

    async deleteRevision(revision: PresenterAbstraction.RevisionRef) {
        const result = await this.run(
            async () => {
                await this.deleteLayoutRevision.execute(revision.id);
                return true;
            },
            `Revision #${revision.version} was deleted.`,
            "Could not delete the revision"
        );
        return result === true;
    }

    private async load(entryId: string) {
        this.loading = true;
        try {
            await this.getRevisions.execute(entryId);
        } catch (error) {
            this.notifications.warning({
                title: "Could not load the layout's revisions",
                description: getLayoutErrorMessage(error)
            });
        } finally {
            runInAction(() => {
                if (this.entryId === entryId) {
                    this.loading = false;
                }
            });
        }
    }

    private async run<T>(action: () => Promise<T>, success: string, failure: string) {
        this.mutating = true;
        try {
            const result = await action();
            this.notifications.success({ title: success });
            return result;
        } catch (error) {
            this.notifications.warning({
                title: failure,
                description: getLayoutErrorMessage(error)
            });
            return null;
        } finally {
            runInAction(() => {
                this.mutating = false;
            });
        }
    }

    private getItemVm(revision: Layout): PresenterAbstraction.ItemViewModel {
        const canEdit = this.permissions.canEdit("page", revision);

        return {
            revision,
            label: getRevisionLabel(revision),
            canCreateFrom: canEdit,
            // A locked revision has been published, so its content can no longer change.
            canEdit: !revision.locked && revision.status === "draft" && canEdit,
            canPublish: revision.status !== "published" && this.permissions.canPublish("page"),
            canUnpublish: revision.status === "published" && this.permissions.canUnpublish("page"),
            canDelete: this.permissions.canDelete("page", revision)
        };
    }
}

export const LayoutRevisionsPresenterRegistration = PresenterAbstraction.createImplementation({
    implementation: LayoutRevisionsPresenterImpl,
    dependencies: [
        LayoutsRepository,
        GetLayoutRevisionsUseCase,
        PublishLayoutUseCase,
        UnpublishLayoutUseCase,
        CreateLayoutRevisionFromUseCase,
        DeleteLayoutRevisionUseCase,
        WbPermissions,
        Notifications
    ]
});
