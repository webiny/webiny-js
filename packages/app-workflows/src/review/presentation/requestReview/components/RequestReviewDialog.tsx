import React from "react";
import { useEffect } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import { Alert } from "@webiny/admin-ui";
import { Button } from "@webiny/admin-ui";
import { Dialog } from "@webiny/admin-ui";
import { Input } from "@webiny/admin-ui";
import { RadioGroup } from "@webiny/admin-ui";
import { Skeleton } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as AutoAwesomeIcon } from "@webiny/icons/auto_awesome.svg";
import { ReactComponent as BoltIcon } from "@webiny/icons/bolt.svg";
import { ReactComponent as GroupIcon } from "@webiny/icons/group.svg";
import type { StepTypeIconName } from "../getStepTypeIcon.js";
import type { ReviewTarget } from "~/review/domain/types.js";
import { ReviewerPicker } from "../../reviewerPicker/components/ReviewerPicker.js";
import { RequestReviewPresenterFeature } from "../feature.js";
import type { RequestReviewMode } from "../abstractions.js";
import type { RequestReviewPresenter } from "../abstractions.js";

const PICK_HINT =
    "Picks are checked again when the step is reached. If the person is no longer eligible, a reviewer is assigned automatically.";
const NOBODY_NOTE =
    "No one other than you can review this step right now. It may wait in the team pool until someone reassigns it.";

const STEPS_CARD_LIST =
    "flex flex-col divide-y divide-neutral-dimmed overflow-hidden rounded-md border-sm border-neutral-muted";
const STEPS_CARD = `${STEPS_CARD_LIST} gap-sm p-md`;

// admin-ui RadioGroup does not forward className, so the one-row layout targets its root.
const PICK_BLOCK =
    "ml-[32px] flex flex-col gap-sm [&_[role=radiogroup]]:grid-flow-col [&_[role=radiogroup]]:auto-cols-max [&_[role=radiogroup]]:gap-md";

const ICONS: Record<StepTypeIconName, React.ReactElement> = {
    group: <GroupIcon />,
    auto_awesome: <AutoAwesomeIcon />,
    bolt: <BoltIcon />
};

const toMode = (value: string): RequestReviewMode => {
    if (value === "pick") {
        return "pick";
    }
    return "automatic";
};

export interface RequestReviewDialogProps {
    target: ReviewTarget;
    targetTitle: string;
    reviewsUrl: string | null;
    onConflict?: () => void;
    onDone: () => void;
    onClose: () => void;
}

interface RequestReviewDialogViewProps {
    presenter: RequestReviewPresenter.Interface;
}

const RequestReviewDialogView = createReactiveComponent(function RequestReviewDialogView(
    props: RequestReviewDialogViewProps
) {
    const { presenter } = props;
    const { vm } = presenter;
    const collapsed = vm.conflict !== null;

    const titleValidation = {
        isValid: vm.titleError === null,
        message: vm.titleError ?? undefined
    };

    let actions = (
        <>
            <Button variant={"tertiary"} text={"Cancel"} onClick={() => presenter.dismiss()} />
            <Dialog.ConfirmAction
                text={"Request review"}
                disabled={!vm.canSubmit}
                onClick={() => presenter.submit()}
            />
        </>
    );
    if (collapsed) {
        actions = (
            <Button variant={"tertiary"} text={"Close"} onClick={() => presenter.dismiss()} />
        );
    }

    return (
        <Dialog
            open={true}
            onOpenChange={open => {
                if (!open && vm.status !== "submitting") {
                    presenter.dismiss();
                }
            }}
            size={"lg"}
            title={"Request review"}
            loading={vm.status === "submitting"}
            actions={actions}
        >
            <div className={"flex flex-col gap-md"}>
                {vm.conflict && (
                    <Alert type={"warning"} variant={"subtle"}>
                        <div className={"font-semibold"}>{vm.conflict.title}</div>
                        <div>{vm.conflict.message}</div>
                    </Alert>
                )}
                {vm.dialogError && (
                    <Alert type={"danger"} variant={"subtle"}>
                        {vm.dialogError}
                    </Alert>
                )}
                <Input
                    label={"Title"}
                    required
                    value={vm.title}
                    onChange={value => presenter.setTitle(value)}
                    validation={titleValidation}
                />
                {vm.status === "loadingSteps" && (
                    <div className={STEPS_CARD}>
                        <Skeleton type={"text"} size={"lg"} />
                        <Skeleton type={"text"} size={"lg"} />
                        <Skeleton type={"text"} size={"lg"} />
                        <Skeleton type={"text"} size={"lg"} />
                    </div>
                )}
                {vm.status === "stepsFailed" && (
                    <Alert
                        type={"danger"}
                        variant={"subtle"}
                        actions={
                            <Alert.Action
                                text={"Try again"}
                                onClick={() => presenter.retrySteps()}
                            />
                        }
                    >
                        {"Could not load the steps for this review."}
                    </Alert>
                )}
                {vm.steps.length > 0 && (
                    <div className={"flex flex-col gap-sm"}>
                        <Text size={"sm"} className={"font-semibold"}>
                            {"Steps"}
                        </Text>
                        <div data-testid={"request-steps"} className={STEPS_CARD_LIST}>
                            {vm.steps.map(step => {
                                const picker = presenter.getPickerPresenter(step.stepId);
                                return (
                                    <div key={step.stepId} className={"flex flex-col gap-sm p-md"}>
                                        <div className={"flex items-center gap-sm"}>
                                            <span
                                                className={
                                                    "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-sm text-neutral-light"
                                                }
                                                style={{ backgroundColor: step.color }}
                                            >
                                                {step.index}
                                            </span>
                                            <div className={"flex grow flex-col"}>
                                                <Text size={"md"} className={"font-semibold"}>
                                                    {step.title}
                                                </Text>
                                                {step.description && (
                                                    <Text
                                                        size={"sm"}
                                                        className={"text-neutral-strong"}
                                                    >
                                                        {step.description}
                                                    </Text>
                                                )}
                                            </div>
                                            <Tag
                                                variant={"neutral-base-outline"}
                                                content={step.typeLabel}
                                                icon={ICONS[step.typeIcon]}
                                            />
                                            <Tag
                                                variant={"neutral-light"}
                                                content={step.labelTag}
                                            />
                                        </div>
                                        {step.allowManualPick && (
                                            <div className={PICK_BLOCK}>
                                                <RadioGroup
                                                    items={[
                                                        { label: "Automatic", value: "automatic" },
                                                        {
                                                            label: "Choose a person",
                                                            value: "pick",
                                                            disabled: step.noCandidates
                                                        }
                                                    ]}
                                                    value={step.mode}
                                                    onChange={value => {
                                                        const mode = toMode(value);
                                                        presenter.setMode(step.stepId, mode);
                                                    }}
                                                />
                                                {step.mode === "pick" && picker && (
                                                    <ReviewerPicker
                                                        presenter={picker}
                                                        label={"Reviewer"}
                                                    />
                                                )}
                                                {step.noCandidates && (
                                                    <Alert type={"warning"} variant={"subtle"}>
                                                        {NOBODY_NOTE}
                                                    </Alert>
                                                )}
                                                <Text size={"sm"} className={"text-neutral-strong"}>
                                                    {PICK_HINT}
                                                </Text>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </Dialog>
    );
});

// One presenter per mounted dialog (transient, R212): init on mount, dispose on unmount.
export const RequestReviewDialog = (props: RequestReviewDialogProps) => {
    const { target, targetTitle, reviewsUrl, onConflict, onDone, onClose } = props;
    const { presenter } = useFeature(RequestReviewPresenterFeature);

    useEffect(() => {
        presenter.init({
            target,
            targetTitle,
            reviewsUrl,
            onConflict,
            onDone,
            onClose
        });
        return () => presenter.dispose();
    }, [presenter, target.namespace, target.targetRevisionId]);

    return <RequestReviewDialogView presenter={presenter} />;
};
