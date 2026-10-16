import type { ComponentType } from "react";
import type { SVGProps } from "react";
import { ReactComponent as SendIcon } from "@webiny/icons/send.svg";
import { ReactComponent as PlayArrowIcon } from "@webiny/icons/play_arrow.svg";
import { ReactComponent as CheckIcon } from "@webiny/icons/check.svg";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";
import { ReactComponent as FrontHandIcon } from "@webiny/icons/front_hand.svg";
import { ReactComponent as SwapHorizIcon } from "@webiny/icons/swap_horiz.svg";
import { ReactComponent as BlockIcon } from "@webiny/icons/block.svg";
import { ReactComponent as RuleIcon } from "@webiny/icons/rule.svg";
import { ReactComponent as RateReviewIcon } from "@webiny/icons/rate_review.svg";
import { ReactComponent as HourglassEmptyIcon } from "@webiny/icons/hourglass_empty.svg";
import { ReactComponent as SyncProblemIcon } from "@webiny/icons/sync_problem.svg";
import { ReactComponent as CheckCircleIcon } from "@webiny/icons/check_circle.svg";
import { ReactComponent as CancelIcon } from "@webiny/icons/cancel.svg";
import { StepState } from "~/review/domain/StepState.js";
import type { StepStateValue } from "~/review/domain/StepState.js";
import type { TargetReviewActionIcon } from "../abstractions.js";
import type { TargetReviewTile } from "../abstractions.js";

type SvgComponent = ComponentType<SVGProps<SVGSVGElement>>;

export const REVIEW_ACTION_ICONS: Record<TargetReviewActionIcon, SvgComponent> = {
    send: SendIcon,
    play_arrow: PlayArrowIcon,
    check: CheckIcon,
    close: CloseIcon,
    front_hand: FrontHandIcon,
    swap_horiz: SwapHorizIcon,
    block: BlockIcon
};

export const REVIEW_TILE_ICONS: Record<TargetReviewTile, SvgComponent> = {
    rule: RuleIcon,
    rate_review: RateReviewIcon,
    hourglass_empty: HourglassEmptyIcon,
    sync_problem: SyncProblemIcon,
    check_circle: CheckCircleIcon,
    cancel: CancelIcon
};

// README 6: the 32px state tile colours.
export const REVIEW_TILE_CLASSES: Record<TargetReviewTile, string> = {
    rule: "bg-neutral-dimmed",
    rate_review: "bg-primary-subtle",
    hourglass_empty: "bg-warning-subtle",
    sync_problem: "bg-destructive-subtle",
    check_circle: "bg-success-subtle",
    cancel: "bg-destructive-subtle"
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
