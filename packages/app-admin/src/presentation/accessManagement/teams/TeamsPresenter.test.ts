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
import type { Team } from "~/features/accessManagement/types.js";
import { ListTeamsUseCase } from "~/features/accessManagement/teams/listTeams/abstractions.js";
import { TeamsListCache } from "~/features/accessManagement/teams/listTeams/abstractions.js";
import { GetTeamUseCase } from "~/features/accessManagement/teams/getTeam/abstractions.js";
import { CreateTeamUseCase } from "~/features/accessManagement/teams/createTeam/abstractions.js";
import { UpdateTeamUseCase } from "~/features/accessManagement/teams/updateTeam/abstractions.js";
import { DeleteTeamUseCase } from "~/features/accessManagement/teams/deleteTeam/abstractions.js";
import { TeamsPresenter as Abstraction } from "./abstractions.js";
import { TeamsPresenter } from "./TeamsPresenter.js";

const TEAMS = [{ id: "team-1", name: "Content", slug: "content", roles: [] }] as unknown as Team[];

describe("TeamsPresenter", () => {
    let presenter: Abstraction.Interface;
    let pageContext: AssistantPageContext.Interface;
    let getTeam: Mock;

    beforeEach(() => {
        const container = new Container();
        const cache = new ListCache<Team>();

        container.registerInstance(TeamsListCache, cache);
        container.registerInstance(ListTeamsUseCase, {
            execute: vi.fn(async () => {
                cache.setItems(TEAMS);
                return { data: TEAMS };
            })
        } as unknown as ListTeamsUseCase.Interface);
        getTeam = vi.fn(async () => TEAMS[0]);
        container.registerInstance(GetTeamUseCase, {
            execute: getTeam
        } as unknown as GetTeamUseCase.Interface);
        container.registerInstance(FormModelFactory, {
            create: () => ({ vm: {}, setData: vi.fn() })
        } as unknown as FormModelFactory.Interface);
        container.registerInstance(StringFormatter, {} as StringFormatter.Interface);
        container.registerInstance(CreateTeamUseCase, {} as CreateTeamUseCase.Interface);
        container.registerInstance(UpdateTeamUseCase, {} as UpdateTeamUseCase.Interface);
        container.registerInstance(DeleteTeamUseCase, {} as DeleteTeamUseCase.Interface);
        container.register(AssistantPageContextImpl).inSingletonScope();
        container.register(ListPresenter);
        container.register(TeamsPresenter).inSingletonScope();

        presenter = container.resolve(Abstraction);
        pageContext = container.resolve(AssistantPageContext);
    });

    it("stops telling the assistant a new team is being edited once the form is closed", async () => {
        presenter.init();
        await vi.waitFor(() => {
            expect(pageContext.get()?.view).toBe("Teams in Access Management");
        });

        presenter.createNew();
        expect(pageContext.get()?.details).toMatchObject({ editing: "a new team, not saved yet" });

        presenter.deselect();
        expect(pageContext.get()?.details).not.toHaveProperty("editing");
    });

    it("starts the next visit with no team open", async () => {
        presenter.init();
        await presenter.selectTeam("team-1");
        expect(presenter.vm.selectedTeam?.id).toBe("team-1");

        presenter.dispose();

        expect(presenter.vm.selectedTeam).toBeNull();
        expect(presenter.vm.showForm).toBe(false);
        expect(pageContext.get()).toBeNull();
    });

    it("drops a team lookup that finishes after the page was left", async () => {
        let resolve: (team: Team) => void = () => {};
        getTeam.mockImplementationOnce(
            () =>
                new Promise<Team>(done => {
                    resolve = done;
                })
        );

        presenter.init();
        const select = presenter.selectTeam("team-1");
        presenter.dispose();
        resolve(TEAMS[0]);
        await select;

        expect(presenter.vm.selectedTeam).toBeNull();
        expect(presenter.vm.showForm).toBe(false);
        expect(presenter.vm.loading).toBe(false);
    });
});
