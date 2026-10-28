import type { ComponentType } from "react";
import type { SVGProps } from "react";
import { ReactComponent as SendIcon } from "@webiny/icons/send.svg";
import { ReactComponent as PlayArrowIcon } from "@webiny/icons/play_arrow.svg";
import { ReactComponent as CheckIcon } from "@webiny/icons/check.svg";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";
import { ReactComponent as FrontHandIcon } from "@webiny/icons/front_hand.svg";
import { ReactComponent as SwapHorizIcon } from "@webiny/icons/swap_horiz.svg";
import { ReactComponent as BlockIcon } from "@webiny/icons/block.svg";
import { ReactComponent as RefreshIcon } from "@webiny/icons/refresh.svg";
import { ReactComponent as RuleIcon } from "@webiny/icons/rule.svg";
import { ReactComponent as RateReviewIcon } from "@webiny/icons/rate_review.svg";
import { ReactComponent as HourglassEmptyIcon } from "@webiny/icons/hourglass_empty.svg";
import { ReactComponent as SyncProblemIcon } from "@webiny/icons/sync_problem.svg";
import { ReactComponent as CheckCircleIcon } from "@webiny/icons/check_circle.svg";
import { ReactComponent as CancelIcon } from "@webiny/icons/cancel.svg";
import { ReactComponent as ProgressActivityIcon } from "@webiny/icons/progress_activity.svg";
import { ReactComponent as BoltIcon } from "@webiny/icons/bolt.svg";
import { ReactComponent as AutoAwesomeIcon } from "@webiny/icons/auto_awesome.svg";
import { StepState } from "~/review/domain/StepState.js";
import type { StepStateValue } from "~/review/domain/StepState.js";
import type { ReviewBarLayout } from "./ReviewBarLayout.js";
import type { TargetReviewActionIcon } from "../abstractions.js";
import type { TargetReviewTagIcon } from "../abstractions.js";
import type { ReviewContentNoticeIcon } from "../abstractions.js";
import type { TargetReviewTile } from "../abstractions.js";

type SvgComponent = ComponentType<SVGProps<SVGSVGElement>>;

export const REVIEW_ACTION_ICONS: Record<TargetReviewActionIcon, SvgComponent> = {
    send: SendIcon,
    play_arrow: PlayArrowIcon,
    check: CheckIcon,
    close: CloseIcon,
    front_hand: FrontHandIcon,
    swap_horiz: SwapHorizIcon,
    block: BlockIcon,
    refresh: RefreshIcon
};

// The icon of a step tag (R263): the running and the failed tags have one.
export const REVIEW_TAG_ICONS: Record<TargetReviewTagIcon, SvgComponent> = {
    progress_activity: ProgressActivityIcon,
    sync_problem: SyncProblemIcon
};

// The icon of the "Content updated by {step}" notice (R262).
export const REVIEW_NOTICE_ICONS: Record<ReviewContentNoticeIcon, SvgComponent> = {
    bolt: BoltIcon,
    auto_awesome: AutoAwesomeIcon
};

export const REVIEW_TILE_ICONS: Record<TargetReviewTile, SvgComponent> = {
    rule: RuleIcon,
    rate_review: RateReviewIcon,
    progress_activity: ProgressActivityIcon,
    hourglass_empty: HourglassEmptyIcon,
    sync_problem: SyncProblemIcon,
    check_circle: CheckCircleIcon,
    cancel: CancelIcon
};

// README 6: the 32px state tile colours and the colour of its icon.
export const REVIEW_TILE_CLASSES: Record<TargetReviewTile, string> = {
    rule: "bg-neutral-dimmed fill-neutral-xstrong",
    rate_review: "bg-primary-subtle fill-accent-default",
    progress_activity: "bg-primary-subtle fill-accent-default",
    hourglass_empty: "bg-warning-subtle fill-warning",
    sync_problem: "bg-destructive-subtle fill-destructive",
    check_circle: "bg-success-subtle fill-success",
    cancel: "bg-destructive-subtle fill-destructive"
};

// README 11: progress segment fills.
export const REVIEW_SEGMENT_CLASSES: Record<StepStateValue, string> = {
    [StepState.Pending]: "bg-neutral-muted",
    [StepState.Awaiting]: "bg-warning",
    [StepState.InReview]: "bg-primary",
    [StepState.Approved]: "bg-success",
    [StepState.Rejected]: "bg-destructive",
    [StepState.Failed]: "bg-neutral-base border-sm border-destructive-default"
};

export const REVIEW_BAR_FRAME_CLASSES: Record<ReviewBarLayout, string> = {
    card: "mx-md my-md rounded-lg bg-neutral-base p-md shadow-sm",
    strip: "bg-neutral-base px-md py-sm-extra border-b-sm border-neutral-dimmed"
};
