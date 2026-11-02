import { Result } from "@webiny/feature/api";
import { DEFAULT_REVIEW_LIST_LIMIT, MAX_REVIEW_LIST_LIMIT } from "~/constants.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewValidationError } from "~/domain/review/errors.js";
import {
    matchesReviewList,
    type ReviewListMatchParams
} from "~/domain/review/matchesReviewList.js";
import { matchesReviewReadFilter } from "~/domain/review/matchesReviewReadFilter.js";
import type { ReviewData } from "~/domain/review/types.js";
import { createReviewListWhere } from "./createReviewListWhere.js";
import {
    decodeReviewListCursor,
    encodeReviewListCursor,
    type ReviewListCursor
} from "./reviewListCursor.js";
import { ReviewListLimits } from "./ReviewListLimits.js";
import { ListReviewsUseCase as ListReviewsUseCaseAbstraction } from "./abstractions.js";

class ListReviewsUseCaseImpl implements ListReviewsUseCaseAbstraction.Interface {
    constructor(
        private repository: ReviewRepository.Interface,
        private limits: ReviewListLimits.Interface
    ) {}

    async execute(
        input: ListReviewsUseCaseAbstraction.Input
    ): ListReviewsUseCaseAbstraction.Return {
        const where = input.where ?? {};
        if (input.list !== "myRequests" && (where.reviewState || where.stepState)) {
            return Result.fail(
                new ReviewValidationError(
                    "The review and step state filters apply only to the my requests list."
                )
            );
        }
        let position: ReviewListCursor | null = null;
        if (input.after) {
            position = decodeReviewListCursor(input.after);
            if (!position) {
                return Result.fail(new ReviewValidationError("The list cursor is invalid."));
            }
        }
        const { readFilter } = input;
        const models = [...readFilter.models, ...readFilter.ownOnlyModels];
        const needsTeams = input.list === "pool" || input.list === "teamInReview";
        if (models.length === 0 || (needsTeams && input.viewerTeamIds.length === 0)) {
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
            models,
            where
        };
        const repositoryWhere = createReviewListWhere(match, readFilter);
        if (position) {
            // Resume at the cursor's time; the rows already examined at it are left out.
            if (sort === "lastChangedOn_ASC") {
                repositoryWhere.lastChangedOn_gte = position.lastChangedOn;
            } else {
                repositoryWhere.lastChangedOn_lte = position.lastChangedOn;
            }
            repositoryWhere.id_not_in = [...position.ids];
        }

        const items: ReviewData[] = [];
        let examined = 0;
        // The repository's own cursor pages within this call only.
        let after: string | null = null;
        for (;;) {
            // oxlint-disable-next-line no-await-in-loop -- one query per page, up to the scan limit.
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
            // The list index can be stale on ddb-os: trust only the primary rows (R18), read in one
            // batch per page (Q78). A row missing from the result was deleted after it was listed.
            const rowIds = rows.map(row => row.id);
            // oxlint-disable-next-line no-await-in-loop -- one batch read per page confirms the page.
            const primary = await this.repository.getMany(rowIds);
            if (primary.isFail()) {
                return Result.fail(primary.error);
            }
            const primaryById = new Map<string, ReviewData>();
            for (const review of primary.value) {
                primaryById.set(review.id, review);
            }

            for (const row of rows) {
                if (position && (items.length >= limit || examined >= this.limits.maxScan)) {
                    // Item-level cursor: the next call resumes at this row (R92). The rest of the
                    // page was confirmed but not examined, so it is listed again by the next call.
                    return Result.ok({
                        items,
                        meta: { cursor: encodeReviewListCursor(position), hasMoreItems: true }
                    });
                }
                examined++;
                // The listed row's own time keeps the cursor in the order the list is read in,
                // even when the primary row is newer (R18).
                if (position && position.lastChangedOn === row.lastChangedOn) {
                    position = { lastChangedOn: row.lastChangedOn, ids: [...position.ids, row.id] };
                } else {
                    position = { lastChangedOn: row.lastChangedOn, ids: [row.id] };
                }

                const review = primaryById.get(row.id);
                if (!review) {
                    continue;
                }
                if (
                    !matchesReviewList(review, match) ||
                    !matchesReviewReadFilter(review, readFilter)
                ) {
                    continue;
                }
                items.push(review);
            }

            const { meta } = page.value;
            const next = meta.hasMoreItems ? meta.cursor : null;
            // A repeated cursor would loop forever; treat it as the end.
            if (!next || next === after) {
                return Result.ok({ items, meta: { cursor: null, hasMoreItems: false } });
            }
            after = next;
            if (position && (items.length >= limit || examined >= this.limits.maxScan)) {
                return Result.ok({
                    items,
                    meta: { cursor: encodeReviewListCursor(position), hasMoreItems: true }
                });
            }
        }
    }
}

export const ListReviewsUseCase = ListReviewsUseCaseAbstraction.createImplementation({
    implementation: ListReviewsUseCaseImpl,
    dependencies: [ReviewRepository, ReviewListLimits]
});
