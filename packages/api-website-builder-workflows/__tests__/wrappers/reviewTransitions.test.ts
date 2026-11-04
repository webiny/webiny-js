import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Result } from "@webiny/feature/api";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { AuthenticationContext } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import { CreateApiKeyUseCase } from "@webiny/api-core/features/security/apiKeys/CreateApiKey/index.js";
import type { Container } from "@webiny/di";
import { ApproveReviewStepUseCase } from "@webiny/api-workflows/features/review/ApproveReviewStep/index.js";
import { RejectReviewStepUseCase } from "@webiny/api-workflows/features/review/RejectReviewStep/index.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage, expectOk } from "~tests/__helpers/pages.js";
import {
    approvePageReview,
    readPage,
    requestPageReview,
    STEP_ID,
    storeWbWorkflow
} from "~tests/__helpers/engine.js";
import { createCmsReview } from "~tests/__helpers/cmsReview.js";
import {
    OTHER_REVIEWER,
    READER,
    REASSIGNER,
    REQUESTER,
    REVIEWER,
    toActor,
    WB_READER,
    WB_WRITER,
    WORKFLOWS_REASSIGN
} from "~tests/__helpers/identities.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import {
    mismatchedTargetRevisions,
    scriptTargetReads,
    throwingTargetRevisions
} from "~tests/__helpers/ScriptedWbPageTargetReads.js";
import {
    throwingAccessChecks,
    throwOnAccessChecks
} from "~tests/__helpers/ThrowingWbPageAccess.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import {
    RecordingEventPublisher,
    recordedEvents
} from "~tests/__helpers/RecordingEventPublisher.js";
import { RequestWebsiteBuilderPageReviewUseCase } from "~/features/wrappers/RequestWebsiteBuilderPageReview/index.js";
import { GetWebsiteBuilderPageReviewUseCase } from "~/features/wrappers/GetWebsiteBuilderPageReview/index.js";
import { StartWebsiteBuilderPageReviewStepUseCase } from "~/features/wrappers/StartWebsiteBuilderPageReviewStep/index.js";
import { TakeOverWebsiteBuilderPageReviewStepUseCase } from "~/features/wrappers/TakeOverWebsiteBuilderPageReviewStep/index.js";
import { ApproveWebsiteBuilderPageReviewStepUseCase } from "~/features/wrappers/ApproveWebsiteBuilderPageReviewStep/index.js";
import { RejectWebsiteBuilderPageReviewStepUseCase } from "~/features/wrappers/RejectWebsiteBuilderPageReviewStep/index.js";
import { CancelWebsiteBuilderPageReviewUseCase } from "~/features/wrappers/CancelWebsiteBuilderPageReview/index.js";

/** Admin stores the pages workflow; REQUESTER's reviews on a page in the root and in "folder-locked". */
const createScenario = async () => {
    const admin = await createUserContext();
    await storeWbWorkflow(admin);
    const page = await createPage(admin, { title: "Page A" });
    const lockedPage = await createPage(admin, { title: "Locked", folderId: "folder-locked" });
    return {
        admin,
        page,
        review: await requestPageReview(admin, page),
        lockedReview: await requestPageReview(admin, lockedPage)
    };
};

/** A context as the identity that counts the engine's calls; setup contexts do not. */
const asUser = (identity: IdentityData | null, permissions: SecurityPermission[]) => {
    return createUserContext({
        identity,
        permissions,
        legacyPlugins: [countEngineCalls, scriptTargetReads, throwOnAccessChecks]
    });
};

const start = (context: CmsContext, reviewId: string) => {
    return context.container
        .resolve(StartWebsiteBuilderPageReviewStepUseCase)
        .execute({ reviewId, stepId: STEP_ID });
};

const takeOver = (context: CmsContext, reviewId: string) => {
    return context.container
        .resolve(TakeOverWebsiteBuilderPageReviewStepUseCase)
        .execute({ reviewId, stepId: STEP_ID });
};

const approve = (context: CmsContext, reviewId: string) => {
    return context.container
        .resolve(ApproveWebsiteBuilderPageReviewStepUseCase)
        .execute({ reviewId, stepId: STEP_ID, comment: "Looks good." });
};

const reject = (context: CmsContext, reviewId: string) => {
    return context.container
        .resolve(RejectWebsiteBuilderPageReviewStepUseCase)
        .execute({ reviewId, stepId: STEP_ID, comment: "Needs another pass." });
};

const cancel = (context: CmsContext, reviewId: string) => {
    return context.container.resolve(CancelWebsiteBuilderPageReviewUseCase).execute({ reviewId });
};

const view = (context: CmsContext, reviewId: string) => {
    return context.container.resolve(GetWebsiteBuilderPageReviewUseCase).execute({ id: reviewId });
};

/** What the tests read from any transition's failure. */
interface TransitionError {
    code: string;
    data?: unknown;
}

interface TransitionCase {
    name: string;
    engineCall: string;
    run: (context: CmsContext, reviewId: string) => Promise<Result<unknown, TransitionError>>;
}

const TRANSITIONS: TransitionCase[] = [
    { name: "start", engineCall: "StartReviewStep", run: start },
    { name: "take over", engineCall: "TakeOverReviewStep", run: takeOver },
    { name: "approve", engineCall: "ApproveReviewStep", run: approve },
    { name: "reject", engineCall: "RejectReviewStep", run: reject },
    { name: "cancel", engineCall: "CancelReview", run: cancel }
];

interface RefusalCase extends TransitionCase {
    identity: IdentityData;
    permissions: SecurityPermission[];
    action: string;
}

const REFUSALS: RefusalCase[] = [
    {
        ...TRANSITIONS[0],
        identity: REVIEWER,
        permissions: WB_READER,
        action: "start this step"
    },
    {
        ...TRANSITIONS[1],
        identity: REVIEWER,
        permissions: WB_READER,
        action: "take over this step"
    },
    {
        ...TRANSITIONS[2],
        identity: REVIEWER,
        permissions: WB_READER,
        action: "approve this step"
    },
    {
        ...TRANSITIONS[3],
        identity: REVIEWER,
        permissions: WB_READER,
        action: "reject this step"
    },
    {
        ...TRANSITIONS[4],
        identity: REQUESTER,
        permissions: WB_WRITER,
        action: "cancel this review"
    }
];

describe("WB review transition wrappers", () => {
    beforeEach(() => {
        engineCalls.length = 0;
    });

    afterEach(() => {
        folderLevels.clear();
        mismatchedTargetRevisions.clear();
        throwingAccessChecks.clear();
        throwingTargetRevisions.clear();
    });

    it("lets reviewers start, take over and approve a step", async () => {
        const { admin, page, review } = await createScenario();
        const reviewer = await asUser(REVIEWER, WB_READER);
        const other = await asUser(OTHER_REVIEWER, WB_READER);

        const started = expectOk(await start(reviewer, review.id));
        const takenOver = expectOk(await takeOver(other, review.id));
        const approved = expectOk(await approve(other, review.id));

        expect(started.steps[0].owner).toEqual(toActor(REVIEWER));
        expect(takenOver.steps[0].owner).toEqual(toActor(OTHER_REVIEWER));
        expect(approved.state).toBe("approved");
        expect((await readPage(admin, page.id)).system?.workflow?.reviewState).toBe("approved");
    });

    it("lets the owner reject a step", async () => {
        const { review } = await createScenario();
        const reviewer = await asUser(REVIEWER, WB_READER);
        expectOk(await start(reviewer, review.id));

        const rejected = expectOk(await reject(reviewer, review.id));

        expect(rejected.state).toBe("rejected");
        expect(rejected.steps[0].comment).toBe("Needs another pass.");
    });

    it.each(REFUSALS)(
        "refuses $name without read access to the page, before the engine",
        async refusal => {
            const { lockedReview } = await createScenario();
            folderLevels.set(
                "folder-locked",
                new Map([
                    [REVIEWER.id, "no-access"],
                    [REQUESTER.id, "no-access"]
                ])
            );
            const context = await asUser(refusal.identity, refusal.permissions);

            const result = await refusal.run(context, lockedReview.id);

            expect(result.error.code).toBe("Workflows/NotAuthorized");
            expect(result.error.data).toEqual({ action: refusal.action });
            expect(engineCalls).not.toContain(refusal.engineCall);
        }
    );

    it.each(TRANSITIONS)("refuses $name by an anonymous identity, before the engine", async t => {
        const { review } = await createScenario();
        const anonymous = await asUser(null, []);

        const result = await t.run(anonymous, review.id);

        expect(result.error.code).toBe("Workflows/NotAuthenticated");
        expect(engineCalls).toEqual([]);
    });

    it.each(TRANSITIONS)("reports a Headless CMS review as not found for $name (R46)", async t => {
        const cmsReview = await createCmsReview(await createUserContext());
        const reviewer = await asUser(REVIEWER, WB_WRITER);

        const result = await t.run(reviewer, cmsReview.id);

        expect(result.error.code).toBe("Workflows/Review/NotFound");
        expect(engineCalls).not.toContain(t.engineCall);
    });

    it.each(TRANSITIONS)(
        "fails $name with a persistence error when the read check throws (R87)",
        async t => {
            const { review } = await createScenario();
            const requester = await asUser(REQUESTER, WB_WRITER);
            throwingAccessChecks.add("canRead");

            const result = await t.run(requester, review.id);

            expect(result.error.code).toBe("Workflows/Review/Persistence");
            expect(engineCalls).toEqual(["GetReview"]);
        }
    );

    it.each(TRANSITIONS)(
        "fails $name with a persistence error when the target read throws, before the engine",
        async t => {
            const { page, review } = await createScenario();
            const requester = await asUser(REQUESTER, WB_WRITER);
            throwingTargetRevisions.add(page.id);

            const result = await t.run(requester, review.id);

            expect(result.error.code).toBe("Workflows/Review/Persistence");
            expect(engineCalls).toEqual(["GetReview"]);
        }
    );

    it.each(TRANSITIONS)(
        "refuses $name when the revision is another page's, before the engine (D2)",
        async t => {
            const { page, review } = await createScenario();
            const requester = await asUser(REQUESTER, WB_WRITER);
            mismatchedTargetRevisions.add(page.id);

            const result = await t.run(requester, review.id);

            expect(result.error.code).toBe("Workflows/NotAuthorized");
            expect(engineCalls).toEqual(["GetReview"]);
        }
    );

    it("refuses cancel by a non-requester without reassign, before the engine", async () => {
        const { review } = await createScenario();
        const reviewer = await asUser(REVIEWER, WB_READER);

        const result = await cancel(reviewer, review.id);

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "cancel a review requested by someone else" });
        expect(engineCalls).not.toContain("CancelReview");
    });

    it("lets the requester cancel their own review", async () => {
        const { review } = await createScenario();
        const requester = await asUser(REQUESTER, WB_WRITER);

        const cancelled = expectOk(await cancel(requester, review.id));

        expect(cancelled.state).toBe("cancelled");
    });

    it("lets a reassigner with read access cancel, but not without it", async () => {
        const { review, lockedReview } = await createScenario();
        folderLevels.set("folder-locked", new Map([[REASSIGNER.id, "no-access"]]));
        const reassigner = await asUser(REASSIGNER, [WORKFLOWS_REASSIGN, ...WB_READER]);

        const cancelled = expectOk(await cancel(reassigner, review.id));
        const denied = await cancel(reassigner, lockedReview.id);

        expect(cancelled.state).toBe("cancelled");
        expect(denied.error.code).toBe("Workflows/NotAuthorized");
        expect(denied.error.data).toEqual({ action: "cancel this review" });
    });

    it("reports a state error, not a permission error, for a finished review (1b R41)", async () => {
        const { admin, review } = await createScenario();
        await approvePageReview(admin, review);
        const requester = await asUser(REQUESTER, WB_WRITER);
        const reassigner = await asUser(REASSIGNER, [WORKFLOWS_REASSIGN, ...WB_READER]);

        const byRequester = await cancel(requester, review.id);
        const byReassigner = await cancel(reassigner, review.id);

        expect(byRequester.error.code).toBe("Workflows/Review/InvalidState");
        expect(byReassigner.error.code).toBe("Workflows/Review/InvalidState");
    });

    it("refuses start by a non-team member in the engine", async () => {
        const { review } = await createScenario();
        const reader = await asUser(READER, WB_READER);

        const result = await start(reader, review.id);

        expect(result.error.code).toBe("Workflows/Review/NotCandidate");
        expect(engineCalls).toContain("StartReviewStep");
    });
});

type ForwardedDecision = ApproveReviewStepUseCase.Input | RejectReviewStepUseCase.Input;

/** The inputs the wrappers forwarded to the engine's approve and reject. Cleared in `beforeEach`. */
const forwardedDecisions: ForwardedDecision[] = [];

class RecordingApproveReviewStep implements ApproveReviewStepUseCase.Interface {
    public constructor(private decoratee: ApproveReviewStepUseCase.Interface) {}

    public async execute(input: ApproveReviewStepUseCase.Input): ApproveReviewStepUseCase.Return {
        forwardedDecisions.push(input);
        return this.decoratee.execute(input);
    }
}

class RecordingRejectReviewStep implements RejectReviewStepUseCase.Interface {
    public constructor(private decoratee: RejectReviewStepUseCase.Interface) {}

    public async execute(input: RejectReviewStepUseCase.Input): RejectReviewStepUseCase.Return {
        forwardedDecisions.push(input);
        return this.decoratee.execute(input);
    }
}

const recordForwardedDecisions = (container: Container) => {
    container.registerDecorator(
        ApproveReviewStepUseCase.createDecorator({
            decorator: RecordingApproveReviewStep,
            dependencies: []
        })
    );
    container.registerDecorator(
        RejectReviewStepUseCase.createDecorator({
            decorator: RecordingRejectReviewStep,
            dependencies: []
        })
    );
};

/** What a hostile or careless caller could put on a decision input next to the allowed fields. */
const SMUGGLED_ISSUES = [
    {
        fieldPath: "title",
        severity: "error",
        message: "Smuggled in by the caller.",
        suggestion: null
    }
];

describe("Website Builder review decision wrappers forward no issues (D132, R171)", () => {
    beforeEach(() => {
        forwardedDecisions.length = 0;
    });

    it("forwards an approve input without issues, even when the caller's input carries some", async () => {
        const { review } = await createScenario();
        const reviewer = await createUserContext({
            identity: REVIEWER,
            permissions: WB_READER,
            legacyPlugins: [recordForwardedDecisions]
        });
        expectOk(await start(reviewer, review.id));
        const input = {
            reviewId: review.id,
            stepId: STEP_ID,
            comment: "Looks good.",
            issues: SMUGGLED_ISSUES
        };

        const approved = expectOk(
            await reviewer.container
                .resolve(ApproveWebsiteBuilderPageReviewStepUseCase)
                .execute(input)
        );

        expect(forwardedDecisions).toHaveLength(1);
        expect("issues" in forwardedDecisions[0]).toBe(false);
        expect(Object.keys(forwardedDecisions[0]).sort()).toEqual([
            "actor",
            "actorTeamIds",
            "comment",
            "reviewId",
            "stepId"
        ]);
        expect(approved.steps[0].issues ?? []).toEqual([]);
    });

    it("forwards a reject input without issues, even when the caller's input carries some", async () => {
        const { review } = await createScenario();
        const reviewer = await createUserContext({
            identity: REVIEWER,
            permissions: WB_READER,
            legacyPlugins: [recordForwardedDecisions]
        });
        expectOk(await start(reviewer, review.id));
        const input = {
            reviewId: review.id,
            stepId: STEP_ID,
            comment: "Needs another pass.",
            issues: SMUGGLED_ISSUES
        };

        const rejected = expectOk(
            await reviewer.container
                .resolve(RejectWebsiteBuilderPageReviewStepUseCase)
                .execute(input)
        );

        expect(forwardedDecisions).toHaveLength(1);
        expect("issues" in forwardedDecisions[0]).toBe(false);
        expect(Object.keys(forwardedDecisions[0]).sort()).toEqual([
            "actor",
            "actorTeamIds",
            "comment",
            "reviewId",
            "stepId"
        ]);
        expect(rejected.steps[0].issues ?? []).toEqual([]);
    });
});

/**
 * A stored API key (created by the admin) and a request context authenticated by its token through
 * api-core's real `AuthenticationContext` → `ApiKeyAuthenticator`; its permissions come from
 * `ApiKeyAuthorizer` (R79). The context starts anonymous, so the test harness serves no
 * permissions of its own.
 */
const createApiKeyContext = async (permissions: SecurityPermission[]) => {
    const admin = await createUserContext();
    const key = expectOk(
        await admin.container.resolve(CreateApiKeyUseCase).execute({
            name: "CI key",
            slug: "ci-key",
            description: "Workflows API-key test",
            permissions
        })
    );
    const context = await createUserContext({ identity: null, permissions: [] });
    const identity = await context.container.resolve(AuthenticationContext).authenticate(key.token);
    context.container.resolve(IdentityContext).setIdentity(identity);
    return { context, keyId: key.id };
};

describe("API keys in page reviews (D133 point 5, R79)", () => {
    it("lets an API key request, read and cancel its own review", async () => {
        const admin = await createUserContext();
        await storeWbWorkflow(admin);
        const page = await createPage(admin, { title: "Page A" });
        const { context: key, keyId } = await createApiKeyContext(WB_WRITER);

        const review = expectOk(
            await key.container
                .resolve(RequestWebsiteBuilderPageReviewUseCase)
                .execute({ targetId: page.entryId, targetRevisionId: page.id })
        );
        const read = expectOk(await view(key, review.id));
        const cancelled = expectOk(await cancel(key, review.id));

        expect(review.createdBy).toEqual({
            type: "user",
            id: keyId,
            displayName: "CI key",
            identityType: "api-key"
        });
        expect(read.flags).toMatchObject({ canStart: false, canCancel: true });
        expect(cancelled.state).toBe("cancelled");
    });

    it("does not let an API key start a pool step: a key belongs to no team", async () => {
        const admin = await createUserContext();
        await storeWbWorkflow(admin);
        // Requested by REQUESTER, so the key is not the requester (that check comes first).
        const review = await requestPageReview(admin, await createPage(admin, { title: "Page A" }));
        const { context: key } = await createApiKeyContext(WB_READER);

        const started = await start(key, review.id);

        expect(started.error.code).toBe("Workflows/Review/NotCandidate");
    });

    it("lets an API key with reassign cancel another user's review", async () => {
        const admin = await createUserContext();
        await storeWbWorkflow(admin);
        const review = await requestPageReview(admin, await createPage(admin, { title: "Page A" }));
        const { context: key } = await createApiKeyContext([WORKFLOWS_REASSIGN, ...WB_READER]);

        const cancelled = expectOk(await cancel(key, review.id));

        expect(cancelled.state).toBe("cancelled");
    });

    it("does not let an API key without reassign cancel another user's review", async () => {
        const admin = await createUserContext();
        await storeWbWorkflow(admin);
        const review = await requestPageReview(admin, await createPage(admin, { title: "Page A" }));
        const { context: key } = await createApiKeyContext(WB_WRITER);

        const result = await cancel(key, review.id);

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "cancel a review requested by someone else" });
        const stored = expectOk(await view(admin, review.id));
        expect(stored.review.state).toBe("inProgress");
    });
});

describe("WB take over wrapper: notifyPreviousOwner (D111, R198)", () => {
    /** One recording context as OTHER_REVIEWER, shared by the three cases below. */
    const recorder = (container: Container) => {
        container.registerDecorator(RecordingEventPublisher);
    };

    /** The reviewer starts the step, then OTHER_REVIEWER takes it over with the given flag (omitted when undefined). */
    const startThenTakeOver = async (notifyPreviousOwner?: boolean) => {
        const { review } = await createScenario();
        const reviewer = await createUserContext({ identity: REVIEWER, permissions: WB_READER });
        expectOk(
            await reviewer.container
                .resolve(StartWebsiteBuilderPageReviewStepUseCase)
                .execute({ reviewId: review.id, stepId: STEP_ID })
        );
        recordedEvents.length = 0;
        const taker = await createUserContext({
            identity: OTHER_REVIEWER,
            permissions: WB_READER,
            legacyPlugins: [scriptTargetReads, throwOnAccessChecks, recorder]
        });
        return taker.container.resolve(TakeOverWebsiteBuilderPageReviewStepUseCase).execute({
            reviewId: review.id,
            stepId: STEP_ID,
            ...(notifyPreviousOwner === undefined ? {} : { notifyPreviousOwner })
        });
    };

    const takenOverFacts = () => {
        return recordedEvents
            .filter(event => event.eventType === "Workflows/Review/StepTakenOver")
            .map(event => event.payload.fact);
    };

    afterEach(() => {
        throwingAccessChecks.clear();
        throwingTargetRevisions.clear();
    });

    it("notifies the previous owner when the argument is omitted", async () => {
        const result = await startThenTakeOver();

        expect(result.isOk()).toBe(true);
        expect(takenOverFacts()).toMatchObject([
            { previousOwner: toActor(REVIEWER), notifyPreviousOwner: true }
        ]);
    });

    it("passes an explicit true to the fact", async () => {
        const result = await startThenTakeOver(true);

        expect(result.isOk()).toBe(true);
        expect(takenOverFacts()).toMatchObject([{ notifyPreviousOwner: true }]);
    });

    it("passes false to the fact and still takes the step over", async () => {
        const result = await startThenTakeOver(false);

        expect(expectOk(result).steps[0].owner).toEqual(toActor(OTHER_REVIEWER));
        expect(takenOverFacts()).toMatchObject([
            { previousOwner: toActor(REVIEWER), notifyPreviousOwner: false }
        ]);
    });
});
