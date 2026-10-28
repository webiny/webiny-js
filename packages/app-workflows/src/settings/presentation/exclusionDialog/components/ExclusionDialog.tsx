import React from "react";
import { Alert } from "@webiny/admin-ui";
import { Button } from "@webiny/admin-ui";
import { DatePicker } from "@webiny/admin-ui";
import type { DatePickerProps } from "@webiny/admin-ui";
import { Dialog } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { Input } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import { ReactComponent as ErrorIcon } from "@webiny/icons/error.svg";
import { ReactComponent as HistoryIcon } from "@webiny/icons/history.svg";
import { ReactComponent as PersonOffIcon } from "@webiny/icons/person_off.svg";
import { WorkflowPicker } from "~/components/picker/WorkflowPicker.js";
import { REASON_MAX_LENGTH } from "~/settings/model/constants.js";
import type { ExclusionDialogNoteVm } from "../abstractions.js";
import type { ExclusionDialogPresenter } from "../abstractions.js";

export interface ExclusionDialogProps {
    presenter: ExclusionDialogPresenter.Interface;
}

const REASON_HINT = "Optional. Shown only to people with Manage workflows or Reassign and operate.";

const NOTE_ICONS: Record<ExclusionDialogNoteVm["kind"], React.ReactElement> = {
    expired: <HistoryIcon />,
    deletedUser: <PersonOffIcon />
};

const NOTE_ICON_NAMES: Record<ExclusionDialogNoteVm["kind"], string> = {
    expired: "history",
    deletedUser: "person_off"
};

/*
 * admin-ui `Input` turns its `maxLength` prop into the `size` attribute, so the native limit is set
 * on the element (R324); the presenter still trims and caps the reason on save (R328).
 */
const limitReasonLength = (element: HTMLInputElement | null): void => {
    if (element === null) {
        return;
    }
    const limit = String(REASON_MAX_LENGTH);
    element.setAttribute("maxlength", limit);
};

/*
 * The Add / Edit exclusion dialog (R324, R325). It renders the presenter's view model only: the
 * alert, the one note slot, the user picker, the reason, the end date with Clear, and the footer.
 * Nothing closes while saving.
 */
export const ExclusionDialog = createReactiveComponent(function ExclusionDialog(
    props: ExclusionDialogProps
) {
    const { presenter } = props;
    const vm = presenter.vm;

    let alert: React.ReactNode = null;
    if (vm.alert !== null) {
        alert = (
            <Alert
                type="danger"
                variant="subtle"
                icon={<ErrorIcon data-icon="error" />}
                data-testid="exclusion-dialog-alert"
            >
                <div>{vm.alert}</div>
            </Alert>
        );
    }

    let note: React.ReactNode = null;
    if (vm.note !== null) {
        let removeEntry: React.ReactNode = null;
        if (vm.note.kind === "deletedUser") {
            removeEntry = (
                <Button
                    variant="tertiary"
                    size="sm"
                    text="Remove entry"
                    disabled={vm.saving}
                    onClick={() => presenter.removeEntry()}
                />
            );
        }
        note = (
            <div
                data-testid="exclusion-dialog-note"
                className="flex items-center gap-sm rounded-md bg-neutral-subtle px-sm-extra py-sm text-sm text-neutral-strong"
            >
                <Icon
                    icon={NOTE_ICONS[vm.note.kind]}
                    label=""
                    size="sm"
                    color="neutral-light"
                    data-icon={NOTE_ICON_NAMES[vm.note.kind]}
                />
                <span className="flex-1">{vm.note.text}</span>
                {removeEntry}
            </div>
        );
    }

    let clear: React.ReactNode = null;
    if (vm.showClear) {
        clear = (
            <Button
                variant="ghost"
                size="sm"
                text="Clear"
                disabled={vm.saving}
                onClick={() => presenter.clearDate()}
            />
        );
    }

    const userDisabled = vm.user.locked || vm.saving;
    let dateValidation: DatePickerProps["validation"] = undefined;
    if (vm.dateError !== null) {
        dateValidation = { isValid: false, message: vm.dateError };
    }

    const actions = (
        <>
            <Button
                variant="tertiary"
                text="Cancel"
                disabled={vm.saving}
                onClick={() => presenter.cancel()}
            />
            <Button
                variant="primary"
                text={vm.confirmLabel}
                disabled={vm.saving}
                onClick={() => presenter.submit()}
            />
        </>
    );

    return (
        <Dialog
            open={true}
            onOpenChange={open => {
                if (!open) {
                    presenter.cancel();
                }
            }}
            title={vm.title}
            dismissible={!vm.saving}
            className="w-[500px]"
            actions={actions}
        >
            <div data-testid="exclusion-dialog" className="flex flex-col gap-md">
                {alert}
                {note}
                <WorkflowPicker
                    label="User"
                    required={true}
                    placeholder="Search users"
                    icon={"search"}
                    value={vm.user.value}
                    selected={vm.user.selected}
                    options={vm.user.options}
                    disabled={userDisabled}
                    clearable={false}
                    error={vm.user.error}
                    onSearch={search => presenter.searchUsers(search)}
                    onChange={id => presenter.setUser(id)}
                />
                <Input
                    label="Reason"
                    placeholder="e.g. On leave"
                    note={REASON_HINT}
                    value={vm.reason}
                    disabled={vm.saving}
                    inputRef={limitReasonLength}
                    onChange={(value: string) => presenter.setReason(value)}
                />
                <div className="flex flex-col gap-xs">
                    <div className="flex items-end gap-sm">
                        <div className="w-[200px]">
                            <DatePicker
                                type="date"
                                label="Until"
                                value={vm.date ?? undefined}
                                minDate={vm.minDate}
                                disabled={vm.saving}
                                validation={dateValidation}
                                onChange={value => presenter.setDate(value ?? null)}
                            />
                        </div>
                        {clear}
                    </div>
                    <Text size="sm" className="text-neutral-strong">
                        {vm.dateHint}
                    </Text>
                </div>
            </div>
        </Dialog>
    );
});
