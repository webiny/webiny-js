import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { AdminUsersPermissions } from "@webiny/app-admin/features/adminUsers/permissions/abstractions.js";
import { ListUsersUseCase } from "@webiny/app-admin/features/adminUsers/users/listUsers/abstractions/index.js";
import { CmsAdvancedSearchPresenter as Abstraction } from "./abstractions.js";
import { CmsAdvancedSearchPresenter } from "./CmsAdvancedSearchPresenter.js";

const USERS: ListUsersUseCase.Result[] = [
    {
        id: "user-1",
        email: "adam@webiny.com",
        firstName: "Adam",
        lastName: "Jones",
        avatar: null,
        createdOn: "2026-11-01T00:00:00.000Z",
        external: false
    },
    {
        id: "user-2",
        email: "nameless@webiny.com",
        firstName: "",
        lastName: "",
        avatar: null,
        createdOn: "2026-11-01T00:00:00.000Z",
        external: false
    }
];

const createPresenter = (canReadUsers: boolean) => {
    const execute = vi.fn(async () => USERS);
    const container = new Container();
    container.registerInstance(AdminUsersPermissions, {
        canRead: () => canReadUsers
    } as unknown as AdminUsersPermissions.Interface);
    container.registerInstance(ListUsersUseCase, { execute });
    container.register(CmsAdvancedSearchPresenter).inSingletonScope();
    return { presenter: container.resolve(Abstraction), execute };
};

describe("CmsAdvancedSearchPresenter", () => {
    it("lists the users as authors, named by full name or email", async () => {
        const { presenter } = createPresenter(true);

        await presenter.loadAuthors();

        expect(presenter.vm.authors).toEqual([
            { id: "user-1", displayName: "Adam Jones" },
            { id: "user-2", displayName: "nameless@webiny.com" }
        ]);
    });

    it("requests nothing for an identity that cannot read users", async () => {
        const { presenter, execute } = createPresenter(false);

        await presenter.loadAuthors();

        expect(execute).not.toHaveBeenCalled();
        expect(presenter.vm.authors).toEqual([]);
    });

    it("lists the users once, however often the search mounts", async () => {
        const { presenter, execute } = createPresenter(true);

        await presenter.loadAuthors();
        await presenter.loadAuthors();

        expect(execute).toHaveBeenCalledTimes(1);
    });

    it("tries again after a failed request", async () => {
        const { presenter, execute } = createPresenter(true);
        execute.mockRejectedValueOnce(new Error("Network error"));

        await presenter.loadAuthors();
        expect(presenter.vm.authors).toEqual([]);

        await presenter.loadAuthors();
        expect(execute).toHaveBeenCalledTimes(2);
        expect(presenter.vm.authors).toHaveLength(2);
    });
});
