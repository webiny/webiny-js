import React from "react";
import { useEffect } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import { Alert } from "@webiny/admin-ui";
import { Button } from "@webiny/admin-ui";
import { Dialog } from "@webiny/admin-ui";
import { Heading } from "@webiny/admin-ui";
import { FormComponentDescription } from "@webiny/admin-ui";
import { FormComponentNote } from "@webiny/admin-ui";
import { Input } from "@webiny/admin-ui";
import { RadioGroup } from "@webiny/admin-ui";
import { Separator } from "@webiny/admin-ui";
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

const PICK_BLOCK = "ml-lg flex flex-col gap-sm";

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
                        <div>
                            <Heading level={6}>{vm.conflict.title}</Heading>
                            <Text as={"div"}>{vm.conflict.message}</Text>
                        </div>
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
                    <div className={"flex flex-col gap-sm"}>
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
                    <div className={"flex flex-col gap-sm pb-md"}>
                        <Heading level={6}>{"Steps"}</Heading>
                        <div data-testid={"request-steps"} className={"flex flex-col gap-md"}>
                            {vm.steps.map((step, position) => {
                                const picker = presenter.getPickerPresenter(step.stepId);
                                return (
                                    <React.Fragment key={step.stepId}>
                                        {position > 0 && <Separator />}
                                        <div className={"flex flex-col gap-sm"}>
                                            <div className={"flex items-center gap-sm"}>
                                                <div
                                                    data-role={"request-step-number"}
                                                    className={"w-xl shrink-0"}
                                                >
                                                    <Tag
                                                        variant={"neutral-base-outline"}
                                                        swatchColor={step.color}
                                                        content={step.index}
                                                    />
                                                </div>
                                                <div className={"flex grow flex-col"}>
                                                    <Heading level={6}>{step.title}</Heading>
                                                    {step.description && (
                                                        <FormComponentDescription
                                                            className={"mb-0"}
                                                            text={
                                                                <Text size={"sm"}>
                                                                    {step.description}
                                                                </Text>
                                                            }
                                                        />
                                                    )}
                                                </div>
                                                <Tag
                                                    variant={"neutral-base-outline"}
                                                    content={step.typeLabel}
                                                    icon={ICONS[step.typeIcon]}
                                                />
                                                {step.labelTag !== step.typeLabel && (
                                                    <Tag
                                                        variant={"neutral-light"}
                                                        content={step.labelTag}
                                                    />
                                                )}
                                            </div>
                                            {step.allowManualPick && (
                                                <div className={PICK_BLOCK}>
                                                    <RadioGroup
                                                        items={[
                                                            {
                                                                label: "Automatic",
                                                                value: "automatic"
                                                            },
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
                                                            <Text>{NOBODY_NOTE}</Text>
                                                        </Alert>
                                                    )}
                                                    <FormComponentNote
                                                        className={"mt-0"}
                                                        text={PICK_HINT}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </React.Fragment>
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
