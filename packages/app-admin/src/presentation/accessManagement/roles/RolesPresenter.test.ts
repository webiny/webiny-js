import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { vi } from "vitest";
import { beforeEach } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import { ListCache } from "~/features/listCache/index.js";
import { ListPresenter } from "~/presentation/listPresenter/ListPresenter.js";
import { AssistantPageContext } from "~/features/assistantPageContext/abstractions.js";
import { AssistantPageContext as AssistantPageContextImpl } from "~/features/assistantPageContext/AssistantPageContext.js";
import { FormModelFactory } from "~/features/formModel/abstractions.js";
import { StringFormatter } from "~/features/stringFormatter/abstractions.js";
import type { Role } from "~/features/accessManagement/types.js";
import { ListRolesUseCase } from "~/features/accessManagement/roles/listRoles/abstractions.js";
import { RolesListCache } from "~/features/accessManagement/roles/listRoles/abstractions.js";
import { GetRoleUseCase } from "~/features/accessManagement/roles/getRole/abstractions.js";
import { CreateRoleUseCase } from "~/features/accessManagement/roles/createRole/abstractions.js";
import { UpdateRoleUseCase } from "~/features/accessManagement/roles/updateRole/abstractions.js";
import { DeleteRoleUseCase } from "~/features/accessManagement/roles/deleteRole/abstractions.js";
import { RolesPresenter as Abstraction } from "./abstractions.js";
import { RolesPresenter } from "./RolesPresenter.js";

const role = (id: string, name: string): Role =>
    ({ id, name, slug: id, description: null, permissions: [] }) as unknown as Role;

const ROLES = [role("role-1", "Editors"), role("role-2", "Reviewers")];

describe("RolesPresenter", () => {
    let presenter: Abstraction.Interface;
    let pageContext: AssistantPageContext.Interface;
    let getRole: Mock;
    let listRoles: Mock;

    /** Makes the next role lookup wait until the test resolves it. */
    const deferRole = () => {
        let resolve: (role: Role) => void = () => {};
        getRole.mockImplementationOnce(
            () =>
                new Promise<Role>(done => {
                    resolve = done;
                })
        );
        return { resolve: (role: Role) => resolve(role) };
    };

    beforeEach(() => {
        const container = new Container();
        const cache = new ListCache<Role>();

        container.registerInstance(RolesListCache, cache);
        listRoles = vi.fn(async () => {
            cache.setItems(ROLES);
            return { data: ROLES };
        });
        container.registerInstance(ListRolesUseCase, {
            execute: listRoles
        } as unknown as ListRolesUseCase.Interface);
        getRole = vi.fn(async (id: string) => ROLES.find(r => r.id === id)!);
        container.registerInstance(GetRoleUseCase, {
            execute: getRole
        } as unknown as GetRoleUseCase.Interface);
        container.registerInstance(FormModelFactory, {
            create: () => ({ vm: {}, setData: vi.fn() })
        } as unknown as FormModelFactory.Interface);
        container.registerInstance(StringFormatter, {} as StringFormatter.Interface);
        container.registerInstance(CreateRoleUseCase, {} as CreateRoleUseCase.Interface);
        container.registerInstance(UpdateRoleUseCase, {} as UpdateRoleUseCase.Interface);
        container.registerInstance(DeleteRoleUseCase, {} as DeleteRoleUseCase.Interface);
        container.register(AssistantPageContextImpl).inSingletonScope();
        container.register(ListPresenter);
        container.register(RolesPresenter).inSingletonScope();

        presenter = container.resolve(Abstraction);
        pageContext = container.resolve(AssistantPageContext);
    });

    it("tells the assistant the roles on screen and the open one, until disposed", async () => {
        presenter.init();

        await vi.waitFor(() => {
            expect(pageContext.get()?.details["visibleRows"]).toEqual([
                { id: "role-1", title: "Editors" },
                { id: "role-2", title: "Reviewers" }
            ]);
            expect(pageContext.get()?.details).toMatchObject({ items: "roles", totalCount: 2 });
        });
        expect(pageContext.get()?.view).toBe("Roles in Access Management");

        await presenter.selectRole("role-2");
        expect(pageContext.get()?.details).toMatchObject({ openRoleId: "role-2" });

        presenter.createNew();
        expect(pageContext.get()?.details).toMatchObject({ editing: "a new role, not saved yet" });
        expect(pageContext.get()?.details).not.toHaveProperty("openRoleId");

        presenter.dispose();
        expect(pageContext.get()).toBeNull();
    });

    it("tells the assistant only the roles the search leaves on screen, in the chosen order", async () => {
        presenter.init();
        await vi.waitFor(() => {
            expect(presenter.list.vm.rows).toHaveLength(2);
        });

        presenter.list.actions.search.set("REVIEW");
        await vi.waitFor(() => {
            expect(pageContext.get()?.details).toMatchObject({
                search: "REVIEW",
                totalCount: 1,
                visibleRows: [{ id: "role-2", title: "Reviewers" }]
            });
        });
        expect(presenter.list.vm.rows.map(row => row.id)).toEqual(["role-2"]);

        presenter.list.actions.search.clear();
        presenter.list.actions.sort.set("name", "DESC");
        await vi.waitFor(() => {
            expect(pageContext.get()?.details["visibleRows"]).toEqual([
                { id: "role-2", title: "Reviewers" },
                { id: "role-1", title: "Editors" }
            ]);
        });

        // Search and sort run over the loaded roles; only the first query loads them.
        expect(listRoles).toHaveBeenCalledTimes(1);
    });

    it("drops a role lookup that finishes after the page was left", async () => {
        const lookup = deferRole();

        presenter.init();
        const select = presenter.selectRole("role-1");
        presenter.dispose();
        lookup.resolve(ROLES[0]);
        await select;

        expect(presenter.vm.selectedRole).toBeNull();
        expect(presenter.vm.showForm).toBe(false);
        expect(presenter.vm.loading).toBe(false);
    });

    it("keeps the role opened last when an earlier lookup finishes after it", async () => {
        const first = deferRole();
        const second = deferRole();

        presenter.init();
        const selectFirst = presenter.selectRole("role-1");
        const selectSecond = presenter.selectRole("role-2");
        second.resolve(ROLES[1]);
        await selectSecond;
        first.resolve(ROLES[0]);
        await selectFirst;

        expect(presenter.vm.selectedRole?.id).toBe("role-2");
        expect(presenter.vm.loading).toBe(false);
    });
});
