import type { Container } from "@webiny/di";
import { WbPageAccess } from "~/features/target/WbPageAccess/index.js";
import type { WbPageTarget } from "~/features/target/WbPageTargetReader/abstractions.js";

export type WbPageAccessCheck =
    | "canRead"
    | "canWrite"
    | "canDelete"
    | "canWriteAnyPage"
    | "canDeleteAnyPage"
    | "canReadInFolder";

/** Access checks that throw, as an FLP lookup or a model read can. Clear it in `afterEach`. */
export const throwingAccessChecks = new Set<WbPageAccessCheck>();

const fail = (check: WbPageAccessCheck): never => {
    throw new Error(`Access check "${check}" failed.`);
};

class ThrowingWbPageAccessImpl implements WbPageAccess.Interface {
    public constructor(private decoratee: WbPageAccess.Interface) {}

    public async canWriteAnyPage(): Promise<boolean> {
        if (throwingAccessChecks.has("canWriteAnyPage")) {
            return fail("canWriteAnyPage");
        }
        return this.decoratee.canWriteAnyPage();
    }

    public async canDeleteAnyPage(): Promise<boolean> {
        if (throwingAccessChecks.has("canDeleteAnyPage")) {
            return fail("canDeleteAnyPage");
        }
        return this.decoratee.canDeleteAnyPage();
    }

    public async canRead(target: WbPageTarget): Promise<boolean> {
        if (throwingAccessChecks.has("canRead")) {
            return fail("canRead");
        }
        return this.decoratee.canRead(target);
    }

    public async canWrite(target: WbPageTarget): Promise<boolean> {
        if (throwingAccessChecks.has("canWrite")) {
            return fail("canWrite");
        }
        return this.decoratee.canWrite(target);
    }

    public async canDelete(target: WbPageTarget): Promise<boolean> {
        if (throwingAccessChecks.has("canDelete")) {
            return fail("canDelete");
        }
        return this.decoratee.canDelete(target);
    }

    public async canReadInFolder(folderId: string | null): Promise<boolean> {
        if (throwingAccessChecks.has("canReadInFolder")) {
            return fail("canReadInFolder");
        }
        return this.decoratee.canReadInFolder(folderId);
    }
}

/** Makes the checks in `throwingAccessChecks` throw (`legacyPlugins`). */
export const throwOnAccessChecks = (container: Container) => {
    container.registerDecorator(
        WbPageAccess.createDecorator({
            decorator: ThrowingWbPageAccessImpl,
            dependencies: []
        })
    );
};
