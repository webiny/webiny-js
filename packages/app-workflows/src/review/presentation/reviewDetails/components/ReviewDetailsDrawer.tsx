import React from "react";
import { useEffect } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import { EmptyState } from "@webiny/admin-ui";
import { Link } from "@webiny/admin-ui";
import { Accordion } from "@webiny/admin-ui";
import { Heading } from "@webiny/admin-ui";
import { Button } from "@webiny/admin-ui";
import { Drawer } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReviewActionDialogs } from "../../actionDialog/components/ReviewActionDialogs.js";
import { toActionRequest } from "../../actionDialog/toActionRequest.js";
import { REVIEW_ACTION_ICONS } from "../../targetReview/components/reviewBarAppearance.js";
import { ReviewDetailsPresenterFeature } from "../feature.js";
import type { ReviewDetailsPresenter } from "../abstractions.js";
import type { ReviewFieldLabels } from "../abstractions.js";
import { isToastInteraction } from "../isToastInteraction.js";
import { ReviewStepRunPanel } from "./ReviewStepRunPanel.js";
import { ReviewStepItem } from "./ReviewStepItem.js";
import { ReviewDetailsSkeleton } from "./ReviewDetailsSkeleton.js";

export interface ReviewDetailsDrawerProps {
    // The review's namespace; the drawer and its nested dialogs run on it (R353, R363).
    namespace: string;
    reviewId: string;
    reviewsUrl: string | null;
    onClose: () => void;
    onChanged?: () => void;
    // The content's field labels, for AI issues (RD5).
    fieldLabels?: ReviewFieldLabels;
    // The content type's label ("Article"), shown before the content title in the header.
    contentTypeLabel?: string | null;
    // Where the reviewed content opens; absent means the content link only closes the drawer.
    contentUrl?: string | null;
}

interface ReviewDetailsDrawerViewProps {
    presenter: ReviewDetailsPresenter.Interface;
    namespace: string;
    reviewsUrl: string | null;
    onClose: () => void;
    onChanged?: () => void;
}

const ReviewDetailsDrawerView = createReactiveComponent(function ReviewDetailsDrawerView(
    props: ReviewDetailsDrawerViewProps
) {
    const { presenter, namespace, reviewsUrl, onClose, onChanged } = props;
    const { vm } = presenter;
    const request = toActionRequest(vm.openAction);

    const footer = vm.actions.map(action => {
        const ActionIcon = REVIEW_ACTION_ICONS[action.icon];
        return (
            <Button
                key={action.kind}
                variant={action.emphasis}
                size={"md"}
                text={action.label}
                icon={<ActionIcon />}
                onClick={() => presenter.openAction(action.kind, action.stepId)}
            />
        );
    });

    // A conflict means the review changed behind the drawer: reload it and tell the host.
    const handleConflict = async () => {
        await presenter.refresh();
        if (onChanged) {
            onChanged();
        }
    };

    let actions: React.ReactNode = undefined;
    if (footer.length > 0) {
        actions = <>{footer}</>;
    }

    let title: React.ReactNode = "Review details";
    if (vm.status === "loading") {
        title = "Loading review…";
    }
    let description: React.ReactNode = undefined;
    if (vm.header !== null) {
        title = (
            <span className={"flex flex-col gap-xs"}>
                <Text as={"span"} size={"sm"}>
                    {"Review details"}
                </Text>
                <span className={"flex flex-wrap items-center gap-sm"}>
                    <Text as={"span"} size={"lg"}>
                        {vm.header.title}
                    </Text>
                    <Tag variant={vm.header.stateVariant} content={vm.header.stateLabel} />
                </span>
            </span>
        );
        if (vm.cancelledText === null) {
            let contentLink = (
                <Button
                    variant={"link"}
                    size={"sm"}
                    text={vm.header.contentLabel}
                    onClick={onClose}
                />
            );
            if (vm.header.contentUrl !== null) {
                contentLink = <Link to={vm.header.contentUrl}>{vm.header.contentLabel}</Link>;
            }
            description = (
                <span className={"flex flex-wrap items-center gap-x-md gap-y-xs"}>
                    <Text as={"span"} size={"sm"}>
                        {"Content: "}
                        {contentLink}
                    </Text>
                    <Text as={"span"} size={"sm"}>
                        {vm.header.requesterLine}
                    </Text>
                    <Text as={"span"} size={"sm"} title={vm.header.requestedTitle}>
                        {vm.header.requestedLine}
                    </Text>
                </span>
            );
        }
    }

    let openContent = <Button variant={"tertiary"} text={"Open content"} onClick={onClose} />;
    if (vm.header?.contentUrl) {
        openContent = (
            <Button variant={"tertiary"} asChild={true}>
                <Link to={vm.header.contentUrl}>{"Open content"}</Link>
            </Button>
        );
    }

    return (
        <>
            <Drawer
                open={true}
                modal={true}
                onInteractOutside={event => {
                    if (isToastInteraction(event.target)) {
                        event.preventDefault();
                    }
                }}
                headerSeparator={true}
                footerSeparator={true}
                size={"lg"}
                title={title}
                description={description}
                onClose={onClose}
                actions={actions}
            >
                <div className={"flex flex-col p-md"}>
                    {vm.status === "loading" && <ReviewDetailsSkeleton />}
                    {vm.status === "failed" && (
                        <div className={"flex flex-col items-center gap-sm"}>
                            <Heading level={5}>{"Could not load review details"}</Heading>
                            <Text size={"md"}>{vm.error}</Text>
                            <Button
                                variant={"tertiary"}
                                text={"Try again"}
                                onClick={() => presenter.refresh()}
                            />
                        </div>
                    )}
                    {vm.cancelledText !== null && (
                        <EmptyState
                            type={"content"}
                            title={"This review was cancelled"}
                            description={vm.cancelledText}
                            actions={openContent}
                        />
                    )}
                    {vm.steps.length > 0 && (
                        <Accordion variant={"container"}>
                            {vm.steps.map(step => (
                                <ReviewStepItem
                                    key={step.stepId}
                                    step={step}
                                    onOpenTask={(stepId, taskId) =>
                                        presenter.openStepRun(stepId, taskId)
                                    }
                                />
                            ))}
                        </Accordion>
                    )}
                </div>
            </Drawer>
            <ReviewActionDialogs
                namespace={namespace}
                request={request}
                reviewsUrl={reviewsUrl}
                onConflict={handleConflict}
                onDone={() => presenter.actionDone()}
                onClose={() => presenter.closeAction()}
            />
            <ReviewStepRunPanel presenter={presenter} />
        </>
    );
});

// One presenter per mounted drawer (transient, R212): init on mount, dispose on unmount.
export const ReviewDetailsDrawer = (props: ReviewDetailsDrawerProps) => {
    const { namespace, reviewId, reviewsUrl, onClose, onChanged, fieldLabels } = props;
    const { contentTypeLabel, contentUrl } = props;
    const { presenter } = useFeature(ReviewDetailsPresenterFeature);

    useEffect(() => {
        presenter.init({
            namespace,
            reviewId,
            reviewsUrl,
            onClose,
            onChanged,
            fieldLabels,
            contentTypeLabel,
            contentUrl
        });
        return () => presenter.dispose();
    }, [presenter, reviewId]);

    return (
        <ReviewDetailsDrawerView
            presenter={presenter}
            namespace={namespace}
            reviewsUrl={reviewsUrl}
            onClose={onClose}
            onChanged={onChanged}
        />
    );
};
