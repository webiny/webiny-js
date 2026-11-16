import { describe, it, expect, vi, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { ListCache } from "~/features/listCache/index.js";
import { ListPresenter } from "~/presentation/listPresenter/ListPresenter.js";
import { AssistantPageContext } from "~/features/assistantPageContext/abstractions.js";
import { AssistantPageContext as AssistantPageContextImpl } from "~/features/assistantPageContext/AssistantPageContext.js";
import { FormModelFactory } from "~/features/formModel/abstractions.js";
import { StringFormatter } from "~/features/stringFormatter/abstractions.js";
import type { Role } from "~/features/accessManagement/types.js";
import {
    ListRolesUseCase,
    RolesListCache
} from "~/features/accessManagement/roles/listRoles/abstractions.js";
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

    beforeEach(() => {
        const container = new Container();
        const cache = new ListCache<Role>();

        container.registerInstance(RolesListCache, cache);
        container.registerInstance(ListRolesUseCase, {
            execute: vi.fn(async () => {
                cache.setItems(ROLES);
                return { data: ROLES };
            })
        } as unknown as ListRolesUseCase.Interface);
        container.registerInstance(GetRoleUseCase, {
            execute: vi.fn(async (id: string) => ROLES.find(r => r.id === id)!)
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
});
