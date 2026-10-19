import { makeAutoObservable } from "mobx";
import { observableRef } from "mobx";
import { WorkflowEditorToasts } from "~/editor/toasts/WorkflowEditorToasts.js";
import type { WorkflowSettings } from "~/settings/domain/types.js";
import { removeExclusion } from "~/settings/model/list/removeExclusion.js";
import type { ExclusionsSource } from "~/settings/presentation/exclusionsPage/ExclusionsSource.js";
import { getExclusionSaveError } from "~/settings/presentation/getExclusionSaveError.js";
import { WorkflowSettingsUseCases } from "~/settings/useCases/WorkflowSettingsUseCases.js";
import { RemoveExclusionDialogPresenter as Abstraction } from "./abstractions.js";
import type { RemoveExclusionDialogInitParams } from "./abstractions.js";

const TITLE = "Remove exclusion?";
const DELETED_USER_BODY = "This user no longer exists, so removing the entry changes nothing else.";
const REMOVED_TOAST = "Exclusion removed";

const formatBody = (name: string): string => {
    return `${name} can be assigned automatically again. Nothing changes for work they already hold.`;
};

/*
 * The Remove exclusion dialog (R318, R325, R326, R327): sends the page's last-loaded list without
 * the entry and hands the server's record back; on failure the row stays and the alert shows.
 */
class RemoveExclusionDialogPresenterImpl implements Abstraction.Interface {
    private source: ExclusionsSource | null = null;
    private userId: string | null = null;
    private alert: string | null = null;
    private removing = false;
    // Every init and dispose starts a new run; a remove of an older run touches nothing.
    private runToken = 0;

    constructor(
        private settings: WorkflowSettingsUseCases.Interface,
        private toasts: WorkflowEditorToasts.Interface
    ) {
        makeAutoObservable<
            RemoveExclusionDialogPresenterImpl,
            "settings" | "toasts" | "source" | "runToken"
        >(this, {
            settings: false,
            toasts: false,
            source: observableRef,
            runToken: false
        });
    }

    get vm(): Abstraction.ViewModel {
        return {
            title: TITLE,
            body: this.buildBody(),
            alert: this.alert,
            removing: this.removing
        };
    }

    init(params: RemoveExclusionDialogInitParams): void {
        this.dispose();
        this.source = params.source;
        this.userId = params.userId;
    }

    async confirm(): Promise<void> {
        const source = this.source;
        const userId = this.userId;
        if (source === null || userId === null || this.removing) {
            return;
        }
        // The next confirm clears the alert (R325).
        this.alert = null;
        // The whole list from the last load without this entry (R318, D106).
        const list = source.getExclusions();
        const exclusions = removeExclusion(list, userId);
        const token = this.runToken;
        this.removing = true;

        let saved: WorkflowSettings;
        try {
            saved = await this.settings.updateSettings({ exclusions });
        } catch (error) {
            if (token === this.runToken) {
                this.applyFailure(error);
            }
            return;
        }
        if (token !== this.runToken) {
            return;
        }
        this.endRemoving();
        this.toasts.success(REMOVED_TOAST);
        source.applySaved({ settings: saved, change: "remove", user: null });
        source.closeDialog();
    }

    cancel(): void {
        // Cancel, Close and Escape do nothing while removing (R325, R326).
        if (this.removing) {
            return;
        }
        const source = this.source;
        if (source === null) {
            return;
        }
        source.closeDialog();
    }

    dispose(): void {
        this.runToken += 1;
        this.source = null;
        this.userId = null;
        this.alert = null;
        this.removing = false;
    }

    private buildBody(): string {
        const source = this.source;
        const userId = this.userId;
        if (source === null || userId === null) {
            return "";
        }
        const name = source.getUserName(userId);
        if (name.state === "deleted") {
            return DELETED_USER_BODY;
        }
        return formatBody(name.label);
    }

    private applyFailure(error: unknown): void {
        // The dialog stays open and the row stays in the list (QBZ-74).
        this.removing = false;
        this.alert = getExclusionSaveError(error);
    }

    private endRemoving(): void {
        this.removing = false;
    }
}

export const RemoveExclusionDialogPresenter = Abstraction.createImplementation({
    implementation: RemoveExclusionDialogPresenterImpl,
    dependencies: [WorkflowSettingsUseCases, WorkflowEditorToasts]
});
