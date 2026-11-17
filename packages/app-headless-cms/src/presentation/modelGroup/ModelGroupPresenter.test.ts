import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { vi } from "vitest";
import { beforeEach } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";
import { ListPresenter } from "@webiny/app-admin/presentation/listPresenter/ListPresenter.js";
import { AssistantPageContext as AssistantPageContextImpl } from "@webiny/app-admin/features/assistantPageContext/AssistantPageContext.js";
import { FormModelFactory } from "@webiny/app-admin/features/formModel/abstractions.js";
import { StringFormatter } from "@webiny/app-admin/features/stringFormatter/abstractions.js";
import type { ModelGroupDto } from "~/features/modelGroup/listModelGroups/abstractions.js";
import { ListModelGroupsUseCase } from "~/features/modelGroup/listModelGroups/abstractions.js";
import { GetModelGroupUseCase } from "~/features/modelGroup/getModelGroup/abstractions.js";
import { CreateModelGroupUseCase } from "~/features/modelGroup/createModelGroup/abstractions.js";
import { UpdateModelGroupUseCase } from "~/features/modelGroup/updateModelGroup/abstractions.js";
import { DeleteModelGroupUseCase } from "~/features/modelGroup/deleteModelGroup/abstractions.js";
import { ModelGroupsCache } from "~/features/modelGroup/abstractions.js";
import { ModelGroupPresenter as Abstraction } from "./abstractions.js";
import { ModelGroupPresenter } from "./ModelGroupPresenter.js";

const GROUPS = [
    { id: "group-1", name: "Blog", slug: "blog", description: "", icon: "fas/star", plugin: false }
] as unknown as ModelGroupDto[];

describe("ModelGroupPresenter", () => {
    let presenter: Abstraction.Interface;
    let getGroup: Mock;

    beforeEach(() => {
        const container = new Container();
        const cache = new ListCache<ModelGroupDto>();

        container.registerInstance(ModelGroupsCache, cache);
        container.registerInstance(ListModelGroupsUseCase, {
            execute: vi.fn(async () => {
                cache.setItems(GROUPS);
                return GROUPS;
            })
        } as unknown as ListModelGroupsUseCase.Interface);
        getGroup = vi.fn(async () => GROUPS[0]);
        container.registerInstance(GetModelGroupUseCase, {
            execute: getGroup
        } as unknown as GetModelGroupUseCase.Interface);
        container.registerInstance(FormModelFactory, {
            create: () => ({ vm: {}, setData: vi.fn() })
        } as unknown as FormModelFactory.Interface);
        container.registerInstance(StringFormatter, {} as StringFormatter.Interface);
        container.registerInstance(
            CreateModelGroupUseCase,
            {} as CreateModelGroupUseCase.Interface
        );
        container.registerInstance(
            UpdateModelGroupUseCase,
            {} as UpdateModelGroupUseCase.Interface
        );
        container.registerInstance(
            DeleteModelGroupUseCase,
            {} as DeleteModelGroupUseCase.Interface
        );
        container.register(AssistantPageContextImpl).inSingletonScope();
        container.register(ListPresenter);
        container.register(ModelGroupPresenter).inSingletonScope();

        presenter = container.resolve(Abstraction);
    });

    it("drops a group lookup that finishes after the user started a new group", async () => {
        let resolve: (group: ModelGroupDto) => void = () => {};
        getGroup.mockImplementationOnce(
            () =>
                new Promise<ModelGroupDto>(done => {
                    resolve = done;
                })
        );

        presenter.init();
        const select = presenter.selectGroup("group-1");
        presenter.createNew();
        resolve(GROUPS[0]);
        await select;

        expect(presenter.vm.selectedGroup).toBeNull();
        expect(presenter.vm.showForm).toBe(true);
        expect(presenter.vm.loading).toBe(false);
    });

    it("drops a group lookup that finishes after the page was left", async () => {
        let resolve: (group: ModelGroupDto) => void = () => {};
        getGroup.mockImplementationOnce(
            () =>
                new Promise<ModelGroupDto>(done => {
                    resolve = done;
                })
        );

        presenter.init();
        const select = presenter.selectGroup("group-1");
        presenter.dispose();
        resolve(GROUPS[0]);
        await select;

        expect(presenter.vm.selectedGroup).toBeNull();
        expect(presenter.vm.showForm).toBe(false);
        expect(presenter.vm.loading).toBe(false);
    });
});
