import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createDrawerSetup } from "~/editor/testing/drawerPresenterKit.js";
import { createTwoRulesStep } from "~/editor/testing/drawerPresenterKit.js";
import { editTeams } from "~/editor/testing/drawerPresenterKit.js";
import { findFormFieldVm } from "~/editor/testing/findFormFieldVm.js";

describe("StepDrawerPresenter: a save in flight (final wave 1)", () => {
    it("opens read-only during a save: fields are disabled and Done drops nothing silently", async () => {
        const { presenter, source } = createDrawerSetup([createTwoRulesStep()], configured => {
            configured.saving = true;
        });

        presenter.open(source, "step-1");

        expect(presenter.vm.readOnly).toBe(true);
        expect(findFormFieldVm(presenter.vm.form, "title")?.disabled).toBe(true);
        // The drawer is read-only for the save, not for the step: no licence or teams notice.
        expect(presenter.vm.notice).toBeNull();
        presenter.vm.form?.setData({ ...presenter.vm.form.getData(), title: "Edited" });
        await presenter.done();
        expect(source.updateStep).not.toHaveBeenCalled();
        expect(source.closeStep).toHaveBeenCalledTimes(1);
    });

    it("becomes editable again when the save ends, and Done keeps the edit", async () => {
        const { presenter, source } = createDrawerSetup([createTwoRulesStep()], configured => {
            configured.saving = true;
        });
        presenter.open(source, "step-1");

        source.setSaving(false);

        expect(presenter.vm.readOnly).toBe(false);
        expect(findFormFieldVm(presenter.vm.form, "title")?.disabled).toBe(false);
        const form = presenter.vm.form;
        form?.setData({ ...form.getData(), title: "Edited" }, { dirty: true });
        await presenter.done();
        expect(source.updateStep).toHaveBeenCalledTimes(1);
        expect(source.updateStep.mock.calls[0][1]).toMatchObject({ title: "Edited" });
    });

    it("disables the fields when a save starts while the drawer is open and keeps what was typed", () => {
        const { presenter, source } = createDrawerSetup([createTwoRulesStep()]);
        presenter.open(source, "step-1");
        editTeams(presenter, ["team-1"]);

        source.setSaving(true);

        expect(findFormFieldVm(presenter.vm.form, "title")?.disabled).toBe(true);
        source.setSaving(false);
        expect(presenter.vm.form?.getData().teams).toEqual(["team-1"]);
    });
});

describe("StepDrawerPresenter: searches skipped while read-only (final wave 2)", () => {
    it("runs the team, user and member searches when the step becomes editable", () => {
        const { presenter, source } = createDrawerSetup([createTwoRulesStep()], configured => {
            configured.readOnly = true;
        });
        presenter.open(source, "step-1");
        expect(source.searchTeams).not.toHaveBeenCalled();
        expect(source.searchUsers).not.toHaveBeenCalled();
        expect(source.searchTargetMembers).not.toHaveBeenCalled();

        source.setReadOnly(false);

        expect(source.searchTeams).toHaveBeenCalledWith("");
        expect(source.searchUsers).toHaveBeenCalledWith("");
        expect(source.searchTargetMembers).toHaveBeenCalledWith(["team-1"], "");
    });
});
