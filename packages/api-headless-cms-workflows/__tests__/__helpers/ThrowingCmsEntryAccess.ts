import type { Container } from "@webiny/di";
import { CmsEntryAccess } from "~/features/target/CmsEntryAccess/index.js";
import type { CmsEntryTarget } from "~/features/target/CmsEntryTargetReader/abstractions.js";

export type CmsEntryAccessCheck =
    | "canRead"
    | "canWrite"
    | "canDelete"
    | "canDeleteAnyEntry"
    | "canReadInFolder";

/** Access checks that throw, as an FLP lookup or a model read can. Clear it in `afterEach`. */
export const throwingAccessChecks = new Set<CmsEntryAccessCheck>();

const fail = (check: CmsEntryAccessCheck): never => {
    throw new Error(`Access check "${check}" failed.`);
};

class ThrowingCmsEntryAccessImpl implements CmsEntryAccess.Interface {
    public constructor(private decoratee: CmsEntryAccess.Interface) {}

    public async canRead(target: CmsEntryTarget): Promise<boolean> {
        if (throwingAccessChecks.has("canRead")) {
            return fail("canRead");
        }
        return this.decoratee.canRead(target);
    }

    public async canWrite(target: CmsEntryTarget): Promise<boolean> {
        if (throwingAccessChecks.has("canWrite")) {
            return fail("canWrite");
        }
        return this.decoratee.canWrite(target);
    }

    public async canDelete(target: CmsEntryTarget): Promise<boolean> {
        if (throwingAccessChecks.has("canDelete")) {
            return fail("canDelete");
        }
        return this.decoratee.canDelete(target);
    }

    public async canDeleteAnyEntry(namespace: string): Promise<boolean> {
        if (throwingAccessChecks.has("canDeleteAnyEntry")) {
            return fail("canDeleteAnyEntry");
        }
        return this.decoratee.canDeleteAnyEntry(namespace);
    }

    public async canReadInFolder(params: CmsEntryAccess.FolderReadParams): Promise<boolean> {
        if (throwingAccessChecks.has("canReadInFolder")) {
            return fail("canReadInFolder");
        }
        return this.decoratee.canReadInFolder(params);
    }
}

/** Makes the checks in `throwingAccessChecks` throw (`legacyPlugins`). */
export const throwOnAccessChecks = (container: Container) => {
    container.registerDecorator(
        CmsEntryAccess.createDecorator({
            decorator: ThrowingCmsEntryAccessImpl,
            dependencies: []
        })
    );
};
