import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Alert, Dialog, Loader, Select, Text } from "@webiny/admin-ui";
import type { JobDto } from "~/shared/types.js";
import type { JobAssignmentPresenter } from "./abstractions.js";

interface AssignJobDialogProps {
    presenter: JobAssignmentPresenter.Interface;
    /** After an assignment: the caller shows the job's new owner. */
    onAssigned: (job: JobDto) => void;
}

/** Assigning a job: pick the admin user it is waiting on. */
export const AssignJobDialog = createReactiveComponent(function AssignJobDialog({
    presenter,
    onAssigned
}: AssignJobDialogProps) {
    const { vm } = presenter;
    if (!vm.jobId) {
        return null;
    }

    const loading = vm.users === null;
    const unchanged = !vm.picked || vm.picked === vm.ownerId;
    const onlyOne = vm.users?.length === 1;

    return (
        <Dialog
            open={true}
            onOpenChange={open => {
                if (!open) {
                    presenter.close();
                }
            }}
            size="md"
            title={`Assign "${vm.jobName}"`}
            actions={
                <>
                    <Dialog.CancelAction text="Cancel" />
                    <Dialog.ConfirmAction
                        text={vm.submitting ? "Assigning…" : "Assign"}
                        disabled={loading || unchanged || vm.submitting}
                        onClick={async () => {
                            const job = await presenter.confirm();
                            if (job) {
                                onAssigned(job);
                            }
                        }}
                    />
                </>
            }
        >
            <div className="flex flex-col gap-md">
                {vm.error ? (
                    <Alert type="danger" variant="subtle">
                        {vm.error}
                    </Alert>
                ) : null}
                {loading ? (
                    <div className="flex items-center gap-sm py-md">
                        <Loader size="sm" />
                        <Text size="sm" className="text-neutral-strong">
                            Reading the admin users.
                        </Text>
                    </div>
                ) : (
                    <>
                        <Select
                            label="Owner"
                            value={vm.picked ?? undefined}
                            onChange={(value: string) => presenter.pick(value)}
                            placeholder="Select an admin user"
                            options={(vm.users ?? []).map(user => ({
                                label: `${user.displayName} (${user.email})`,
                                value: user.id
                            }))}
                        />
                        <Text size="sm" className="text-neutral-strong">
                            {onlyOne
                                ? "This instance has one admin user, so there is no one else to assign to yet."
                                : "The owner shows on the board and in the table, and the job counts under Mine for them."}
                        </Text>
                    </>
                )}
            </div>
        </Dialog>
    );
});
