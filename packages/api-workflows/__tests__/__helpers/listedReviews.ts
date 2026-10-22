import type { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import type {
    Actor,
    ReviewData,
    ReviewListReadFilter,
    ReviewState,
    StepState
} from "~/domain/review/types.js";
import type { ListReviewsInput, ListReviewsOutput } from "~/features/review/ListReviews/index.js";
import {
    ARTICLE_MODEL,
    createRequestedReview,
    expectOk,
    REVIEW_TEAM_ID,
    reviewer,
    toSaveData
} from "./fixtures.js";

export interface ListedReviewParams {
    id: string;
    /** Minutes after 10:00 for `lastChangedOn`; give every seeded review its own, so no ties. */
    minute: number;
    model?: string;
    title?: string;
    /** Defaults to the `requester` fixture. */
    requester?: Actor;
    isActive?: boolean;
    state?: ReviewState;
    /** Default "awaiting". */
    stepState?: StepState | null;
    ownerId?: string | null;
    /** Default `[REVIEW_TEAM_ID]`. */
    teamIds?: string[];
    /** Default "review". */
    stepType?: string | null;
    /** The target's folder; default the `targetContext` fixture's "folder-1", `null` is root. */
    folderId?: string | null;
    /** The target's author; default the `targetContext` fixture's (the `requester`). */
    authorId?: string;
}

export const listedAt = (minute: number): string => {
    return `2026-10-09T10:${String(minute).padStart(2, "0")}:00.000Z`;
};

/**
 * A review with the list fields set directly, as the save path would store them. Lists read only
 * the top-level fields, so the steps stay those of a freshly requested review.
 */
export const createListedReview = (params: ListedReviewParams): ReviewData => {
    const base = toSaveData(
        createRequestedReview({
            id: params.id,
            targetRevisionId: `${params.id}#0001`,
            requester: params.requester
        })
    );
    const folder = base.targetContext.folder;
    let targetFolder = folder;
    if (params.folderId === null) {
        targetFolder = null;
    } else if (params.folderId !== undefined) {
        targetFolder = { id: params.folderId, type: folder?.type ?? "cms:article" };
    }
    return {
        ...base,
        targetContext: {
            ...base.targetContext,
            folder: targetFolder,
            author: {
                ...base.targetContext.author,
                id: params.authorId ?? base.targetContext.author.id
            }
        },
        model: params.model ?? ARTICLE_MODEL,
        title: params.title ?? `Review ${params.id}`,
        isActive: params.isActive ?? true,
        state: params.state ?? "inProgress",
        currentStepState: params.stepState === undefined ? "awaiting" : params.stepState,
        currentOwnerId: params.ownerId ?? null,
        currentCandidateTeamIds: params.teamIds ?? [REVIEW_TEAM_ID],
        currentStepType: params.stepType === undefined ? "review" : params.stepType,
        lastChangedOn: listedAt(params.minute)
    };
};

/** Saves through the repository: nothing produces these states yet (R93). */
export const seedListedReviews = async (
    repository: ReviewRepository.Interface,
    reviews: ListedReviewParams[]
): Promise<void> => {
    for (const params of reviews) {
        expectOk(await repository.create(createListedReview(params)));
    }
};

/** Reads every target of these namespaces as the `reviewer` fixture, no folder denied. */
export const createReadFilter = (
    overrides: Partial<ReviewListReadFilter> = {}
): ReviewListReadFilter => {
    return {
        models: [ARTICLE_MODEL],
        ownOnlyModels: [],
        authorId: reviewer.id,
        deniedFolderIds: [],
        ...overrides
    };
};

/** The `reviewer` fixture as viewer, member of `REVIEW_TEAM_ID`, every article readable. */
export const createListInput = (overrides: Partial<ListReviewsInput> = {}): ListReviewsInput => {
    return {
        list: "pool",
        viewerUserId: reviewer.id,
        viewerTeamIds: [REVIEW_TEAM_ID],
        readFilter: createReadFilter(),
        ...overrides
    };
};

export const listedIds = (output: ListReviewsOutput): string[] => {
    return output.items.map(item => item.id);
};
