import { makeAutoObservable, runInAction } from "mobx";
import { AdminUsersPermissions } from "@webiny/app-admin/features/adminUsers/permissions/abstractions.js";
import { ListUsersUseCase } from "@webiny/app-admin/features/adminUsers/users/listUsers/abstractions/index.js";
import { CmsAdvancedSearchPresenter as Abstraction } from "./abstractions.js";
import type { EntryAuthor } from "./abstractions.js";
import type { ICmsAdvancedSearchPresenter } from "./abstractions.js";
import type { ICmsAdvancedSearchViewModel } from "./abstractions.js";

const toAuthor = (user: ListUsersUseCase.Result): EntryAuthor => {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
    return { id: user.id, displayName: fullName || user.email };
};

class CmsAdvancedSearchPresenterImpl implements ICmsAdvancedSearchPresenter {
    private authors: EntryAuthor[] = [];
    private authorsLoaded = false;

    constructor(
        private permissions: AdminUsersPermissions.Interface,
        private listUsers: ListUsersUseCase.Interface
    ) {
        makeAutoObservable<CmsAdvancedSearchPresenterImpl, "permissions" | "listUsers">(this, {
            permissions: false,
            listUsers: false
        });
    }

    get vm(): ICmsAdvancedSearchViewModel {
        return { authors: this.authors };
    }

    /**
     * Users are listed once per session. An identity that cannot read users gets no Author filter,
     * and nothing is requested for it. A failed request leaves the Author filter out and is tried
     * again the next time the search mounts.
     */
    async loadAuthors(): Promise<void> {
        if (this.authorsLoaded || !this.permissions.canRead("user")) {
            return;
        }
        this.authorsLoaded = true;

        try {
            const users = await this.listUsers.execute();
            runInAction(() => {
                this.authors = users.map(toAuthor);
            });
        } catch {
            runInAction(() => {
                this.authorsLoaded = false;
            });
        }
    }
}

export const CmsAdvancedSearchPresenter = Abstraction.createImplementation({
    implementation: CmsAdvancedSearchPresenterImpl,
    dependencies: [AdminUsersPermissions, ListUsersUseCase]
});
