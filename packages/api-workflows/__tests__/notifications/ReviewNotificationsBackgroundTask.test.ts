import { beforeEach, describe, expect, it } from "vitest";
import { MailerService } from "@webiny/api-mailer";
import type {
    TaskDefinition,
    TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import {
    WebsocketsListConnectionsUseCase,
    WebsocketsSendToConnectionsUseCase
} from "@webiny/api-websockets/exports/api.js";
import {
    createRoutingContext,
    resetRoutingFakes,
    ROUTING_USERS
} from "~tests/__helpers/routingContext.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { FakeListUsers } from "~tests/__helpers/FakeListUsers.js";
import { readableUsers } from "~tests/__helpers/FakeReviewTargetReadAccess.js";
import {
    RecordingEventPublisher,
    recordedEvents,
    workflowEventTypes
} from "~tests/__helpers/RecordingEventPublisher.js";
import { RecordingMailer } from "~tests/__helpers/RecordingMailer.js";
import { FakeWebsocketConnections } from "~tests/__helpers/FakeWebsocketConnections.js";
import { RecordingWebsocketsSend } from "~tests/__helpers/RecordingWebsocketsSend.js";
import { FakeWorkflowsAdminUrl } from "~tests/__helpers/FakeWorkflowsAdminUrl.js";
import { FakeReviewTargetLink } from "~tests/__helpers/FakeReviewTargetLink.js";
import { createFakeTaskController } from "~tests/__helpers/FakeTaskController.js";
import { resetFakeTasks } from "~tests/__helpers/FakeTaskService.js";
import {
    createAutomationStep,
    registerTestAutomation
} from "~tests/__helpers/TestAutomationDefinition.js";
import { AUTOMATION_STEP_ID, automationActor } from "~tests/__helpers/stepRunReviews.js";
import {
    ARTICLE_MODEL,
    createReviewStep,
    createWorkflow,
    expectOk,
    NOW,
    requester,
    targetContext
} from "~tests/__helpers/fixtures.js";
import {
    WORKFLOWS_NOTIFICATION_WEBSOCKET_ACTION,
    WORKFLOWS_REVIEW_CHANGED_WEBSOCKET_ACTION
} from "~/features/notifications/shared/constants.js";
import { Review } from "~/domain/review/Review.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import type { ReviewData } from "~/domain/review/types.js";
import type { WorkflowStep } from "~/domain/workflow/types.js";
import { ReviewSaver } from "~/features/review/ReviewSaver/abstractions.js";
import {
    STEP_RUN_MAX_ITERATIONS,
    STEP_RUN_TASK_DEFINITION_ID
} from "~/features/stepRun/constants.js";
import { WorkflowStepRunTaskHandler } from "~/features/stepRun/WorkflowStepRunTask/index.js";
import type { StepRunTaskInput } from "~/features/stepRun/types.js";
import { WorkflowsAdminUrlService } from "~/features/notifications/WorkflowsAdminUrlService/index.js";
import { ReviewTargetLink } from "~/features/notifications/ReviewTargetLink/index.js";

/** A tenant that is not the root tenant of the test context. */
const TENANT_ID = "tenant-a";
const ADMIN_URL = "https://admin.example.com";
const TITLE = "Article article-1";
const REJECT_COMMENT = "The links are broken.";
const MAIL_FAILED = "Could not send a workflow notification e-mail.";
const WEBSOCKET_FAILED = "Could not send a workflow websocket notification.";
const SECRET = "SECRET-e2e-failure";

const DEFINITION: TaskDefinition.Metadata = {
    id: STEP_RUN_TASK_DEFINITION_ID,
    title: "Workflow step run",
    isPrivate: true,
    maxIterations: STEP_RUN_MAX_ITERATIONS
};

/** The automation step "Check links" notifies by e-mail; its settings pick the outcome. */
const createAutomationReviewStep = (settings: Record<string, unknown>): WorkflowStep => {
    return {
        ...createAutomationStep({ id: AUTOMATION_STEP_ID, title: "Check links", settings }),
        notifications: [{ id: "e-mail" }]
    };
};

/** A pool review step after the automation: reaching it runs the pool lookups (R183). */
const createPoolReviewStep = (): WorkflowStep => {
    return {
        ...createReviewStep({ id: "editorial", title: "Editorial review" }),
        notifications: [{ id: "e-mail" }]
    };
};

/**
 * A review whose automation step "Check links" is running as `task-1`, and which notifies by
 * e-mail. By default the workflow is that one step: approving it approves the review.
 */
const createNotifyingAutomationReview = (
    settings: Record<string, unknown>,
    steps: WorkflowStep[] = [createAutomationReviewStep(settings)]
): Review => {
    const review = expectOk(
        Review.request({
            id: "review-1",
            workflow: createWorkflow({ steps }),
            model: ARTICLE_MODEL,
            targetId: "article-1",
            targetRevisionId: "article-1#0001",
            title: TITLE,
            targetContext,
            picks: [],
            requester,
            now: NOW
        })
    );
    expectOk(
        review.reachRun({ actor: requester, owner: automationActor, taskId: "task-1", now: NOW })
    );
    return review;
};

const setup = async () => {
    const mailer = new RecordingMailer();
    const connections = new FakeWebsocketConnections();
    const sends = new RecordingWebsocketsSend();
    const directory = new FakeListUsers(ROUTING_USERS);
    // The routing context adds the read-access fakes the pool lookup needs.
    const { context } = await createRoutingContext({
        setup: container => {
            captureLoggedErrors(container);
            container.registerDecorator(RecordingEventPublisher);
            registerTestAutomation(container);
            container.registerInstance(MailerService, mailer);
            container.registerInstance(WebsocketsListConnectionsUseCase, connections);
            container.registerInstance(WebsocketsSendToConnectionsUseCase, sends);
            container.registerInstance(WorkflowsAdminUrlService, new FakeWorkflowsAdminUrl());
            container.registerInstance(ReviewTargetLink, new FakeReviewTargetLink());
            container.registerInstance(ListUsersUseCase, directory);
        }
    });
    const { container } = context;
    directory.watch(container.resolve(IdentityContext));
    const tenantContext = container.resolve(TenantContext);
    const rootTenantId = tenantContext.getTenant().id;
    const tenant = { ...tenantContext.getTenant(), id: TENANT_ID };
    const handler = container.resolveImplementation(
        WorkflowStepRunTaskHandler
    ) as TaskHandler.Interface<StepRunTaskInput>;
    const saver = container.resolve(ReviewSaver);
    const repository = container.resolve(ReviewRepository);

    return {
        mailer,
        connections,
        sends,
        directory,
        tenantContext,
        rootTenantId,
        /** Runs `callback` with `tenant-a` as the current tenant: the review lives in it. */
        inTenant: <TValue>(callback: () => Promise<TValue>): Promise<TValue> => {
            return tenantContext.withTenant(tenant, callback);
        },
        seed: async (review: Review): Promise<void> => {
            expectOk(await saver.save(review));
            recordedEvents.length = 0;
            loggedErrors.length = 0;
            mailer.sent.length = 0;
            sends.sent.length = 0;
        },
        read: async (): Promise<ReviewData> => expectOk(await repository.get("review-1")),
        /**
         * One iteration of the step run task, driven the way the runner does (R157). It calls
         * `handler.run` directly, so it is NOT inside the task runner's `withoutAuthorization`
         * (D26): authorization is on here, and the `authorizationEnabled === false` assertions
         * below prove that the recipient service wraps its own lookups (D36).
         */
        run: async () => {
            const { controller, task } = createFakeTaskController({ iterations: 1 });
            return handler.run({ input: task.input, controller, definition: DEFINITION });
        }
    };
};

describe("review notifications inside the background-task step run (R188, R195, R196, D36)", () => {
    beforeEach(() => {
        resetRoutingFakes();
        resetFakeTasks();
        recordedEvents.length = 0;
        loggedErrors.length = 0;
    });

    it("notifies the requester once, with the step title as decider, in the tenant of the run (reject)", async () => {
        const {
            inTenant,
            seed,
            run,
            read,
            tenantContext,
            rootTenantId,
            connections,
            sends,
            mailer
        } = await setup();
        // The same user is connected in the root tenant and in `tenant-a`: only the second counts.
        connections.connect(requester.id, rootTenantId, "conn-root");
        connections.connect(requester.id, TENANT_ID, "conn-tenant-a");

        expect(tenantContext.getTenant().id).toBe(rootTenantId);
        expect(rootTenantId).not.toBe(TENANT_ID);
        const stored = await inTenant(async () => {
            expect(tenantContext.getTenant().id).toBe(TENANT_ID);
            await seed(
                createNotifyingAutomationReview({ mode: "reject", comment: REJECT_COMMENT })
            );
            const result = await run();
            expect(result.status).toBe("done");
            return read();
        });

        expect(stored.state).toBe("rejected");
        expect(workflowEventTypes()).toEqual(["Workflows/Review/StepRejected"]);
        // One frame, to the tenant-a connection only: the root connection of the same user got nothing.
        expect(sends.sent).toHaveLength(1);
        expect(sends.sent[0].connections).toEqual([
            { connectionId: "conn-tenant-a", endpoint: "wss://websockets.test" }
        ]);
        // The automation is named by its step title (D107), never by the requester's name it carries.
        expect(sends.sent[0].message.data).toMatchObject({
            event: "rejected",
            reviewId: "review-1",
            stepId: AUTOMATION_STEP_ID,
            namespace: ARTICLE_MODEL,
            title: `“${TITLE}” was rejected at Check links`,
            body: `Check links: “${REJECT_COMMENT}”. Create a new revision to fix it.`
        });
        // One mail to the requester, with a link that opens the review's own tenant.
        expect(mailer.sent).toHaveLength(1);
        expect(mailer.sent[0].bcc).toEqual(["user-requester@webiny.test"]);
        expect(mailer.sent[0].subject).toBe(`Rejected: ${TITLE} (Check links)`);
        expect(mailer.sent[0].text).toContain(
            `Open content: ${ADMIN_URL}/cms/content-entries/article?id=article-1%230001&tenantId=${TENANT_ID}`
        );
        expect(loggedErrors).toEqual([]);
    });

    it("notifies the requester once when the automation approves the review", async () => {
        const { inTenant, seed, run, read, connections, sends, mailer, rootTenantId } =
            await setup();
        connections.connect(requester.id, rootTenantId, "conn-root");
        connections.connect(requester.id, TENANT_ID, "conn-tenant-a");

        const stored = await inTenant(async () => {
            await seed(createNotifyingAutomationReview({ comment: "Links are fine." }));
            await run();
            return read();
        });

        expect(stored.state).toBe("approved");
        expect(workflowEventTypes()).toEqual([
            "Workflows/Review/StepApproved",
            "Workflows/Review/Approved"
        ]);
        expect(sends.sent).toHaveLength(1);
        expect(sends.sent[0].connections.map(connection => connection.connectionId)).toEqual([
            "conn-tenant-a"
        ]);
        expect(sends.sent[0].message.data).toMatchObject({
            event: "approved",
            title: `“${TITLE}” was approved`
        });
        expect(mailer.sent).toHaveLength(1);
        expect(mailer.sent[0].subject).toBe(`Approved: ${TITLE}`);
        expect(mailer.sent[0].text).toContain(`tenantId=${TENANT_ID}`);
    });

    it("sends no frame to a requester who is connected only in the root tenant, but still sends the mail", async () => {
        const { inTenant, seed, run, connections, sends, mailer, rootTenantId } = await setup();
        connections.connect(requester.id, rootTenantId, "conn-root");

        await inTenant(async () => {
            await seed(
                createNotifyingAutomationReview({ mode: "reject", comment: REJECT_COMMENT })
            );
            await run();
        });

        expect(sends.sent).toEqual([]);
        expect(mailer.sent).toHaveLength(1);
        expect(loggedErrors).toEqual([]);
    });

    it("looks the users up without authorization, not as the requester (D36)", async () => {
        const { inTenant, seed, run, directory, connections } = await setup();
        connections.connect(requester.id, TENANT_ID, "conn-tenant-a");

        await inTenant(async () => {
            await seed(
                createNotifyingAutomationReview({ mode: "reject", comment: REJECT_COMMENT })
            );
            directory.calls.length = 0;
            await run();
        });

        expect(directory.calls.length).toBeGreaterThan(0);
        for (const call of directory.calls) {
            expect(call.authorizationEnabled).toBe(false);
        }
        expect(directory.calls.some(call => call.input.where?.id_in?.includes(requester.id))).toBe(
            true
        );
    });

    it("runs the pool lookups inside the step run when the next step is a pool step, all without authorization", async () => {
        const { inTenant, seed, run, read, directory, connections, sends, mailer } = await setup();
        readableUsers.add("user-anna");
        connections.connect("user-anna", TENANT_ID, "conn-anna-a");
        connections.connect(requester.id, TENANT_ID, "conn-requester-a");

        const stored = await inTenant(async () => {
            await seed(
                createNotifyingAutomationReview({}, [
                    createAutomationReviewStep({ comment: "Links are fine." }),
                    createPoolReviewStep()
                ])
            );
            directory.calls.length = 0;
            await run();
            return read();
        });

        expect(stored).toMatchObject({ state: "inProgress", currentStepId: "editorial" });
        expect(workflowEventTypes()).toEqual([
            "Workflows/Review/StepApproved",
            "Workflows/Review/StepReached"
        ]);
        // The pool is told with a notification. The requester gets the silent change message
        // (R253): the automation actor never drops the requester (R254, D58).
        const notifications = sends.sent.filter(
            frame => frame.message.action === WORKFLOWS_NOTIFICATION_WEBSOCKET_ACTION
        );
        const changes = sends.sent.filter(
            frame => frame.message.action === WORKFLOWS_REVIEW_CHANGED_WEBSOCKET_ACTION
        );
        expect(sends.sent).toHaveLength(2);
        expect(notifications).toHaveLength(1);
        expect(notifications[0].connections.map(connection => connection.connectionId)).toEqual([
            "conn-anna-a"
        ]);
        expect(notifications[0].message.data).toMatchObject({
            event: "poolReached",
            stepId: "editorial"
        });
        expect(changes).toHaveLength(1);
        expect(changes[0].connections.map(connection => connection.connectionId)).toEqual([
            "conn-requester-a"
        ]);
        expect(changes[0].message.data).toMatchObject({
            kind: "stepApproved",
            reviewId: "review-1",
            stepId: AUTOMATION_STEP_ID,
            namespace: ARTICLE_MODEL
        });
        expect(mailer.sent).toHaveLength(1);
        expect(mailer.sent[0].bcc).toEqual(["user-anna@webiny.test"]);
        // The member lookup (`teams_in`) and the e-mail lookup (`id_in`) both ran, all unauthorized.
        expect(directory.calls.some(call => call.input.where?.teams_in !== undefined)).toBe(true);
        expect(directory.calls.some(call => call.input.where?.id_in !== undefined)).toBe(true);
        for (const call of directory.calls) {
            expect(call.authorizationEnabled).toBe(false);
        }
    });

    interface StepRunFailureCase {
        name: string;
        arrange: (fakes: Awaited<ReturnType<typeof setup>>) => void;
        frames: number;
        mails: number;
        logged: Array<{ message: string; count: number }>;
    }

    const STEP_RUN_FAILURE_CASES: StepRunFailureCase[] = [
        {
            name: "the mailer throws",
            arrange: ({ mailer }) => {
                mailer.throwOn = [0];
                mailer.failureMessage = SECRET;
            },
            frames: 1,
            mails: 1,
            logged: [{ message: MAIL_FAILED, count: 1 }]
        },
        {
            name: "the mailer returns a failed Result",
            arrange: ({ mailer }) => {
                mailer.failOn = [0];
                mailer.failureMessage = SECRET;
            },
            frames: 1,
            mails: 1,
            logged: [{ message: MAIL_FAILED, count: 1 }]
        },
        {
            name: "the websocket connection list throws",
            arrange: ({ connections }) => {
                connections.mode = "throw";
                connections.failureMessage = SECRET;
            },
            frames: 0,
            mails: 1,
            logged: [{ message: WEBSOCKET_FAILED, count: 1 }]
        },
        {
            name: "the websocket send fails",
            arrange: ({ sends }) => {
                sends.mode = "fail";
                sends.failureMessage = SECRET;
            },
            frames: 1,
            mails: 1,
            logged: [{ message: WEBSOCKET_FAILED, count: 1 }]
        },
        {
            name: "the mailer and the websocket send both throw",
            arrange: ({ mailer, sends }) => {
                mailer.throwOn = [0];
                sends.mode = "throw";
                mailer.failureMessage = SECRET;
                sends.failureMessage = SECRET;
            },
            frames: 1,
            mails: 1,
            logged: [
                { message: MAIL_FAILED, count: 1 },
                { message: WEBSOCKET_FAILED, count: 1 }
            ]
        }
    ];

    it.each(STEP_RUN_FAILURE_CASES)(
        "finishes the task and keeps the decision when $name (R87, R196)",
        async testCase => {
            const fakes = await setup();
            const { inTenant, seed, run, read, connections, sends, mailer } = fakes;
            connections.connect(requester.id, TENANT_ID, "conn-tenant-a");
            testCase.arrange(fakes);

            const { result, stored } = await inTenant(async () => {
                await seed(
                    createNotifyingAutomationReview({ mode: "reject", comment: REJECT_COMMENT })
                );
                const taskResult = await run();
                return { result: taskResult, stored: await read() };
            });

            expect(result.status).toBe("done");
            expect(stored.state).toBe("rejected");
            expect(sends.sent).toHaveLength(testCase.frames);
            expect(mailer.sent).toHaveLength(testCase.mails);
            expect(loggedErrors).toHaveLength(
                testCase.logged.reduce((total, entry) => total + entry.count, 0)
            );
            for (const entry of testCase.logged) {
                expect(
                    loggedErrors.filter(logged => logged.message === entry.message)
                ).toHaveLength(entry.count);
            }
            expect(JSON.stringify(sends.sent)).not.toContain(SECRET);
            expect(JSON.stringify(mailer.sent)).not.toContain(SECRET);
        }
    );
});
