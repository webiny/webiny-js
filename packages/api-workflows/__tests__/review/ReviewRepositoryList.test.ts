import { describe, expect, it } from "vitest";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { seedListedReviews } from "~tests/__helpers/listedReviews.js";
import {
    ARTICLE_MODEL,
    expectOk,
    OTHER_TEAM_ID,
    otherReviewer,
    REVIEW_TEAM_ID,
    reviewer
} from "~tests/__helpers/fixtures.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";

const BOTH_MODELS = [ARTICLE_MODEL, "wb.page"];

/**
 * r1: awaiting pool row; r2: owned by `reviewer`, other team, requested by `otherReviewer`, AI;
 * r3: failed automation page review, two teams; r4: cancelled, no current step.
 */
const createSeededRepository = async () => {
    let cmsListCalls = 0;
    const { context } = await createContextHandler({
        setup: container => {
            container.registerDecorator(
                ListLatestEntriesUseCase.createDecorator({
                    decorator: class {
                        constructor(private decoratee: ListLatestEntriesUseCase.Interface) {}
                        async execute(
                            ...args: Parameters<ListLatestEntriesUseCase.Interface["execute"]>
                        ) {
                            cmsListCalls++;
                            return this.decoratee.execute(...args);
                        }
                    },
                    dependencies: []
                })
            );
        }
    });
    const repository = context.container.resolve(ReviewRepository);
    await seedListedReviews(repository, [
        { id: "r01", minute: 1, title: "Spring launch" },
        {
            id: "r02",
            minute: 2,
            title: "Autumn sale",
            requester: otherReviewer,
            stepState: "inReview",
            ownerId: reviewer.id,
            teamIds: [OTHER_TEAM_ID],
            stepType: "ai"
        },
        {
            id: "r03",
            minute: 3,
            model: "wb.page",
            stepState: "failed",
            teamIds: [REVIEW_TEAM_ID, OTHER_TEAM_ID],
            stepType: "automation"
        },
        {
            id: "r04",
            minute: 4,
            isActive: false,
            state: "cancelled",
            stepState: null,
            teamIds: [],
            stepType: null
        }
    ]);
    return {
        repository,
        cmsListCalls: () => cmsListCalls
    };
};

interface RepositoryListCase {
    name: string;
    where: Partial<ReviewRepository.ListWhere>;
    expected: string[];
}

/** One row per pre-filter key, alone: this is the A40 measurement on each storage. */
const CASES: RepositoryListCase[] = [
    { name: "no filter", where: {}, expected: ["r01", "r02", "r03", "r04"] },
    { name: "model_in", where: { model_in: [ARTICLE_MODEL] }, expected: ["r01", "r02", "r04"] },
    { name: "isActive", where: { isActive: true }, expected: ["r01", "r02", "r03"] },
    { name: "state", where: { state: "cancelled" }, expected: ["r04"] },
    { name: "currentStepState", where: { currentStepState: "inReview" }, expected: ["r02"] },
    { name: "currentOwnerId", where: { currentOwnerId: reviewer.id }, expected: ["r02"] },
    {
        name: "currentOwnerId_not",
        where: { currentOwnerId_not: reviewer.id },
        expected: ["r01", "r03", "r04"]
    },
    {
        name: "currentCandidateTeamIds_in",
        where: { currentCandidateTeamIds_in: [OTHER_TEAM_ID] },
        expected: ["r02", "r03"]
    },
    {
        name: "currentStepType_in",
        where: { currentStepType_in: ["ai", "automation"] },
        expected: ["r02", "r03"]
    },
    { name: "requesterId", where: { requesterId: otherReviewer.id }, expected: ["r02"] },
    {
        name: "requesterId_not",
        where: { requesterId_not: otherReviewer.id },
        expected: ["r01", "r03", "r04"]
    },
    { name: "title_contains", where: { title_contains: "launch" }, expected: ["r01"] }
];

describe("ReviewRepository.list (A40)", () => {
    it.each(CASES)("filters in storage by $name", async testCase => {
        const { repository } = await createSeededRepository();

        const page = expectOk(
            await repository.list({
                where: { model_in: BOTH_MODELS, ...testCase.where },
                sort: "lastChangedOn_ASC",
                limit: 50
            })
        );

        expect(page.items.map(item => item.id)).toEqual(testCase.expected);
    });

    it("sorts by lastChangedOn both ways and pages with the cursor", async () => {
        const { repository } = await createSeededRepository();
        const where = { model_in: BOTH_MODELS };

        const descending = expectOk(
            await repository.list({ where, sort: "lastChangedOn_DESC", limit: 50 })
        );
        const first = expectOk(
            await repository.list({ where, sort: "lastChangedOn_ASC", limit: 2 })
        );
        const second = expectOk(
            await repository.list({
                where,
                sort: "lastChangedOn_ASC",
                limit: 2,
                after: first.meta.cursor
            })
        );

        expect(descending.items.map(item => item.id)).toEqual(["r04", "r03", "r02", "r01"]);
        expect(first.items.map(item => item.id)).toEqual(["r01", "r02"]);
        expect(first.meta.hasMoreItems).toBe(true);
        expect(second.items.map(item => item.id)).toEqual(["r03", "r04"]);
        expect(second.meta.hasMoreItems).toBe(false);
    });

    it("resumes at a list cursor's time and leaves out the ids it already examined", async () => {
        const { repository } = await createSeededRepository();
        const where = { model_in: BOTH_MODELS };
        const atMinute2 = "2026-10-09T10:02:00.000Z";

        const ascending = expectOk(
            await repository.list({
                where: { ...where, lastChangedOn_gte: atMinute2, id_not_in: ["r02"] },
                sort: "lastChangedOn_ASC",
                limit: 50
            })
        );
        const descending = expectOk(
            await repository.list({
                where: { ...where, lastChangedOn_lte: atMinute2, id_not_in: ["r02"] },
                sort: "lastChangedOn_DESC",
                limit: 50
            })
        );

        expect(ascending.items.map(item => item.id)).toEqual(["r03", "r04"]);
        expect(descending.items.map(item => item.id)).toEqual(["r01"]);
    });

    it("answers an empty model or team list without querying", async () => {
        const { repository, cmsListCalls } = await createSeededRepository();
        const before = cmsListCalls();

        const noModels = expectOk(
            await repository.list({ where: { model_in: [] }, sort: "lastChangedOn_ASC", limit: 50 })
        );
        const noTeams = expectOk(
            await repository.list({
                where: { model_in: BOTH_MODELS, currentCandidateTeamIds_in: [] },
                sort: "lastChangedOn_ASC",
                limit: 50
            })
        );

        expect(noModels.items).toEqual([]);
        expect(noTeams.items).toEqual([]);
        expect(noTeams.meta).toEqual({ cursor: null, hasMoreItems: false, totalCount: 0 });
        expect(cmsListCalls()).toBe(before);
    });
});
