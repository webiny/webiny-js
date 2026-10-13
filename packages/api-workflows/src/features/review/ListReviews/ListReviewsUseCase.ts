import { Result } from "@webiny/feature/api";
import { DEFAULT_REVIEW_LIST_LIMIT, MAX_REVIEW_LIST_LIMIT } from "~/constants.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewNotFoundError, ReviewValidationError } from "~/domain/review/errors.js";
import {
    matchesReviewList,
    type ReviewListMatchParams
} from "~/domain/review/matchesReviewList.js";
import type { ReviewData } from "~/domain/review/types.js";
import { createReviewListWhere } from "./createReviewListWhere.js";
import {
    decodeReviewListCursor,
    encodeReviewListCursor,
    type ReviewListCursor
} from "./reviewListCursor.js";
import { ReviewListLimits } from "./ReviewListLimits.js";
import { ListReviewsUseCase as UseCase } from "./abstractions.js";

class ListReviewsUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: ReviewRepository.Interface,
        private limits: ReviewListLimits.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const where = input.where ?? {};
        if (input.list !== "myRequests" && (where.reviewState || where.stepState)) {
            return Result.fail(
                new ReviewValidationError(
                    "The review and step state filters apply only to the my requests list."
                )
            );
        }
        let start: ReviewListCursor = { after: null, skip: 0 };
        if (input.after) {
            const decoded = decodeReviewListCursor(input.after);
            if (!decoded) {
                return Result.fail(new ReviewValidationError("The list cursor is invalid."));
            }
            start = decoded;
        }
        const needsTeams = input.list === "pool" || input.list === "teamInReview";
        if (input.models.length === 0 || (needsTeams && input.viewerTeamIds.length === 0)) {
            return Result.ok({ items: [], meta: { cursor: null, hasMoreItems: false } });
        }

        // A missing or non-finite limit takes the default; others round down into 1..100 (R92).
        const requestedLimit =
            typeof input.limit === "number" && Number.isFinite(input.limit)
                ? Math.floor(input.limit)
                : DEFAULT_REVIEW_LIST_LIMIT;
        const limit = Math.min(Math.max(requestedLimit, 1), MAX_REVIEW_LIST_LIMIT);
        const sort =
            input.sort ??
            (input.list === "myRequests" ? "lastChangedOn_DESC" : "lastChangedOn_ASC");
        const match: ReviewListMatchParams = {
            list: input.list,
            viewerUserId: input.viewerUserId,
            viewerTeamIds: input.viewerTeamIds,
            models: input.models,
            where
        };
        const repositoryWhere = createReviewListWhere(match);

        const items: ReviewData[] = [];
        let examined = 0;
        let after = start.after;
        let skip = start.skip;
        for (;;) {
            const page = await this.repository.list({
                where: repositoryWhere,
                sort,
                limit: this.limits.pageSize,
                after
            });
            if (page.isFail()) {
                return Result.fail(page.error);
            }

            const rows = page.value.items;
            for (let index = skip; index < rows.length; index++) {
                if (items.length >= limit || examined >= this.limits.maxScan) {
                    // Item-level cursor: the next call resumes at this row of this page (R92).
                    return Result.ok({
                        items,
                        meta: {
                            cursor: encodeReviewListCursor({ after, skip: index }),
                            hasMoreItems: true
                        }
                    });
                }
                examined++;

                // The list index can be stale on ddb-os: trust only the primary row (R18).
                const primary = await this.repository.get(rows[index].id);
                if (primary.isFail()) {
                    if (primary.error instanceof ReviewNotFoundError) {
                        // Deleted after it was listed.
                        continue;
                    }
                    return Result.fail(primary.error);
                }
                const review = primary.value;
                if (!matchesReviewList(review, match)) {
                    continue;
                }

                let readable = false;
                try {
                    readable = await input.canRead(review);
                } catch {
                    // A failing target read hides the row instead of failing the list (R92).
                    readable = false;
                }
                if (readable) {
                    items.push(review);
                }
            }

            const { meta } = page.value;
            const next = meta.hasMoreItems ? meta.cursor : null;
            // A repeated cursor would loop forever; treat it as the end.
            if (!next || next === after) {
                return Result.ok({ items, meta: { cursor: null, hasMoreItems: false } });
            }
            after = next;
            skip = 0;
            if (items.length >= limit || examined >= this.limits.maxScan) {
                return Result.ok({
                    items,
                    meta: { cursor: encodeReviewListCursor({ after, skip: 0 }), hasMoreItems: true }
                });
            }
        }
    }
}

export const ListReviewsUseCase = UseCase.createImplementation({
    implementation: ListReviewsUseCaseImpl,
    dependencies: [ReviewRepository, ReviewListLimits]
});
