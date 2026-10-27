import { describe, expect, it } from "vitest";
import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import {
    CreatePageUseCase,
    PublishPageUseCase,
    UnpublishPageUseCase
} from "@webiny/api-website-builder/exports/api/website-builder/page.js";
import { PageNotFoundError } from "@webiny/api-website-builder/domain/page/errors.js";
import { ExecuteScheduledActionUseCase } from "@webiny/api-scheduler/exports/api/scheduler.js";
import { ExecutionFailedError } from "@webiny/api-scheduler/features/ExecuteScheduledAction/abstractions.js";
import {
    SchedulePublishPageUseCase,
    ScheduleUnpublishPageUseCase
} from "~/exports/api/website-builder/scheduler.js";
import { useHandler } from "./__mocks/context/useHandler.js";

/** Publishing fails with WB's own error, as a blocked or missing page does. */
class FailingPublishPage implements PublishPageUseCase.Interface {
    public constructor(private decoratee: PublishPageUseCase.Interface) {}

    public async execute(params: PublishPageUseCase.Params): PublishPageUseCase.Return {
        return Result.fail(new PageNotFoundError(params.id));
    }
}

const failPublishPage = (container: Container) => {
    container.registerDecorator(
        PublishPageUseCase.createDecorator({ decorator: FailingPublishPage, dependencies: [] })
    );
};

/** Unpublishing fails with WB's own error. */
class FailingUnpublishPage implements UnpublishPageUseCase.Interface {
    public constructor(private decoratee: UnpublishPageUseCase.Interface) {}

    public async execute(params: UnpublishPageUseCase.Params): UnpublishPageUseCase.Return {
        return Result.fail(new PageNotFoundError(params.id));
    }
}

const failUnpublishPage = (container: Container) => {
    container.registerDecorator(
        UnpublishPageUseCase.createDecorator({ decorator: FailingUnpublishPage, dependencies: [] })
    );
};

describe("Scheduled page publish keeps the publish error (R103)", () => {
    it("rejects with the publish use case's own error, code and data kept", async () => {
        const context = await useHandler<ApiCoreContext>({
            legacyPlugins: [failPublishPage]
        }).handler();
        const page = (
            await context.container.resolve(CreatePageUseCase).execute({
                properties: { title: "Scheduled page" },
                metadata: {},
                bindings: {},
                elements: {},
                location: { folderId: "root" }
            })
        ).value!;
        const scheduled = await context.container.resolve(SchedulePublishPageUseCase).execute({
            id: page.id,
            tenant: "root",
            scheduleFor: new Date(Date.now() + 100000)
        });
        expect(scheduled.isFail()).toBe(false);

        const result = await context.container.resolve(ExecuteScheduledActionUseCase).execute({
            id: scheduled.value!.scheduledAction.id,
            tenant: "root",
            namespace: scheduled.value!.scheduledAction.namespace
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Scheduler/Execution/Failed");
        expect((result.error as ExecutionFailedError).originalError).toBeInstanceOf(
            PageNotFoundError
        );
        expect((result.error as ExecutionFailedError).originalError).toMatchObject({
            code: "WebsiteBuilder/Page/NotFound",
            data: { id: page.id }
        });
    });

    it("rejects with the unpublish use case's own error, code and data kept", async () => {
        const context = await useHandler<ApiCoreContext>({
            legacyPlugins: [failUnpublishPage]
        }).handler();
        const page = (
            await context.container.resolve(CreatePageUseCase).execute({
                properties: { title: "Scheduled page" },
                metadata: {},
                bindings: {},
                elements: {},
                location: { folderId: "root" }
            })
        ).value!;
        const scheduled = await context.container.resolve(ScheduleUnpublishPageUseCase).execute({
            id: page.id,
            tenant: "root",
            scheduleFor: new Date(Date.now() + 100000)
        });
        expect(scheduled.isFail()).toBe(false);

        const result = await context.container.resolve(ExecuteScheduledActionUseCase).execute({
            id: scheduled.value!.scheduledAction.id,
            tenant: "root",
            namespace: scheduled.value!.scheduledAction.namespace
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Scheduler/Execution/Failed");
        expect((result.error as ExecutionFailedError).originalError).toBeInstanceOf(
            PageNotFoundError
        );
        expect((result.error as ExecutionFailedError).originalError).toMatchObject({
            code: "WebsiteBuilder/Page/NotFound",
            data: { id: page.id }
        });
    });
});
