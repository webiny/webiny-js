import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Alert, Button, Checkbox, Dialog, Icon, Loader, Text, cn } from "@webiny/admin-ui";
import { ReactComponent as DoneIcon } from "@webiny/icons/check_circle.svg";
import { ReactComponent as ErrorIcon } from "@webiny/icons/error.svg";
import { ReactComponent as SkipIcon } from "@webiny/icons/remove_circle_outline.svg";
import type { JobDeletionStepDto } from "~/shared/types.js";
import {
    FINALITY,
    LIVE_SITE_REFUSAL,
    TENANT_LEFTOVERS,
    deleteJobLines
} from "~/presentation/ExtractionList/deleteJobLines.js";
import type { JobDeletionPresenter } from "./abstractions.js";

const STEP_LABEL: Record<JobDeletionStepDto["step"], string> = {
    check: "Check the counts",
    "site-content": "The site's content",
    "site-tenant": "The site's tenant",
    pages: "Pages in root",
    components: "Components in root",
    images: "Images",
    "reference-images": "Reference images",
    theme: "Theme",
    runs: "Runs",
    job: "The job"
};

const StepRow = ({ step }: { step: JobDeletionStepDto }) => (
    <div className="flex items-start gap-sm py-xs">
        <span className="flex h-md-plus w-md-plus flex-shrink-0 items-center justify-center">
            {step.status === "running" ? (
                <Loader size="xs" />
            ) : (
                <Icon
                    size="sm"
                    label={step.status}
                    icon={
                        step.status === "done" ? (
                            <DoneIcon />
                        ) : step.status === "failed" ? (
                            <ErrorIcon />
                        ) : (
                            <SkipIcon />
                        )
                    }
                    className={cn(
                        step.status === "done" && "fill-success-default",
                        step.status === "failed" && "fill-destructive-default",
                        step.status === "skipped" && "fill-neutral-strong"
                    )}
                />
            )}
        </span>
        <div className="flex min-w-0 flex-col">
            <Text size="sm" className="font-semibold text-neutral-primary">
                {STEP_LABEL[step.step]}
            </Text>
            <Text
                size="sm"
                className={cn(
                    step.status === "failed" ? "text-destructive-primary" : "text-neutral-strong"
                )}
            >
                {step.detail}
            </Text>
        </div>
    </div>
);

const List = ({ title, items }: { title: string; items: string[] }) =>
    items.length === 0 ? null : (
        <div className="flex flex-col gap-xs">
            <Text size="sm" className="font-semibold uppercase tracking-wider text-neutral-strong">
                {title}
            </Text>
            <ul className="flex list-disc flex-col gap-xxs pl-md">
                {items.map(item => (
                    <li key={item}>
                        <Text size="sm" className="text-neutral-primary">
                            {item}
                        </Text>
                    </li>
                ))}
            </ul>
        </div>
    );

interface DeleteJobDialogProps {
    presenter: JobDeletionPresenter.Interface;
    /** After a finished delete, when the dialog closes: the caller leaves the job's page or reloads. */
    onDeleted: () => void;
}

/**
 * Deleting a job: what goes, after the sharing checks, and what stays and why; the site as a choice
 * when it is live; then the delete's steps as the task records them.
 */
export const DeleteJobDialog = createReactiveComponent(function DeleteJobDialog({
    presenter,
    onDeleted
}: DeleteJobDialogProps) {
    const { vm } = presenter;
    if (!vm.jobId) {
        return null;
    }

    const record = vm.deletion;
    const plan = record?.plan;
    const deletion = record?.deletion;
    const counting = !plan || plan.status === "running";
    const deleting = deletion?.status === "running" || vm.submitting;
    const deleted = deletion?.status === "done";
    const lines = plan && plan.status === "done" ? deleteJobLines(plan) : null;
    const siteRefused = lines?.site?.kind === "choice" && !vm.includeSite;
    // A count made after a delete stopped is the one to act on: show it, and the delete again.
    const recounted = Boolean(
        deletion?.status === "failed" && plan?.computedOn && plan.computedOn > deletion.startedOn
    );
    const started = Boolean(deletion) && !recounted;

    const close = () => {
        presenter.close();
        if (deleted) {
            onDeleted();
        }
    };

    const canDelete =
        Boolean(lines) && !plan?.blocked && !siteRefused && !deleting && !deleted && !started;

    return (
        <Dialog
            open={true}
            onOpenChange={open => {
                if (!open) {
                    close();
                }
            }}
            size="md"
            title={`Delete "${vm.jobName}"?`}
            actions={
                deleted ? (
                    <Button variant="primary" text="Close" onClick={close} />
                ) : (
                    <>
                        <Dialog.CancelAction text={started ? "Close" : "Cancel"} />
                        {deletion?.status === "failed" && started ? (
                            <Button
                                variant="secondary"
                                text="Count again"
                                onClick={() => presenter.recount()}
                            />
                        ) : null}
                        {!started ? (
                            <Dialog.ConfirmAction
                                text={deleting ? "Deleting…" : "Delete job"}
                                disabled={!canDelete}
                                onClick={() => presenter.confirm()}
                            />
                        ) : null}
                    </>
                )
            }
        >
            <div className="flex flex-col gap-md">
                {vm.error ? (
                    <Alert type="danger" variant="subtle">
                        {vm.error}
                    </Alert>
                ) : null}

                {counting && !started ? (
                    <div className="flex items-center gap-sm py-md">
                        <Loader size="sm" />
                        <Text size="sm" className="text-neutral-strong">
                            Counting what this deletes and what other jobs still use. It reads every
                            page in root, so it takes a little while.
                        </Text>
                    </div>
                ) : null}

                {plan?.status === "failed" ? (
                    <Alert type="danger" variant="subtle">
                        {`Could not count what this deletes: ${plan.error ?? "no reason given"}`}
                    </Alert>
                ) : null}

                {recounted && deletion?.error ? (
                    <Alert type="warning" variant="subtle">
                        {`The last delete stopped: ${deletion.error} The counts below are what is there now.`}
                    </Alert>
                ) : null}

                {plan?.blocked && !started ? (
                    <Alert type="warning" variant="subtle">
                        {plan.blocked}
                    </Alert>
                ) : null}

                {lines && !started ? (
                    <>
                        <List
                            title="Deletes"
                            items={[
                                ...lines.removes,
                                ...(lines.site && lines.site.kind !== "choice"
                                    ? [lines.site.text]
                                    : [])
                            ]}
                        />
                        {lines.site?.kind === "choice" ? (
                            <div className="flex flex-col gap-xs rounded-md border border-neutral-dimmed p-sm-extra">
                                <Checkbox
                                    checked={vm.includeSite}
                                    onChange={(checked: boolean) =>
                                        presenter.setIncludeSite(checked)
                                    }
                                    label={lines.site.text}
                                />
                                <Text size="sm" className="pl-lg text-neutral-strong">
                                    {TENANT_LEFTOVERS}
                                </Text>
                            </div>
                        ) : lines.site?.kind === "included" ? (
                            <Text size="sm" className="text-neutral-strong">
                                {TENANT_LEFTOVERS}
                            </Text>
                        ) : null}
                        <List title="Stays" items={lines.keeps} />
                        {siteRefused ? (
                            <Text size="sm" className="text-warning-primary">
                                {LIVE_SITE_REFUSAL}
                            </Text>
                        ) : null}
                        <Text size="sm" className="font-semibold text-neutral-primary">
                            {FINALITY}
                        </Text>
                    </>
                ) : null}

                {deletion && started ? (
                    <div className="flex flex-col">
                        {deletion.steps.map(step => (
                            <StepRow key={step.step} step={step} />
                        ))}
                        {deletion.status === "running" ? (
                            <Text size="sm" className="pt-xs text-neutral-strong">
                                The delete continues if you close this.
                            </Text>
                        ) : null}
                        {deletion.status === "failed" ? (
                            <Text size="sm" className="pt-xs text-neutral-strong">
                                It stopped at the step marked. What is listed as done is gone;
                                nothing after it was touched. Count again to see what is left.
                            </Text>
                        ) : null}
                        {deleted ? (
                            <Text size="sm" className="pt-xs font-semibold text-neutral-primary">
                                Deleted.
                            </Text>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </Dialog>
    );
});
