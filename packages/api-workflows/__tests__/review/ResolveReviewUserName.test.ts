import { beforeEach } from "vitest";
import { hasErrorSource } from "~/domain/hasErrorSource.js";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetUserUseCase } from "@webiny/api-core/features/users/GetUser/index.js";
import { ResolveReviewUserNameUseCase } from "~/features/review/ResolveReviewUserName/index.js";
import { ReviewPersistenceError } from "~/domain/review/errors.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { expectOk } from "~tests/__helpers/fixtures.js";
import { KNOWN_USER_ID } from "~tests/__helpers/FakeNamedUsers.js";
import { KNOWN_USER_NAME } from "~tests/__helpers/FakeNamedUsers.js";
import { OTHER_KNOWN_USER_ID } from "~tests/__helpers/FakeNamedUsers.js";
import { OTHER_KNOWN_USER_NAME } from "~tests/__helpers/FakeNamedUsers.js";
import { registerFakeNamedUsers } from "~tests/__helpers/FakeNamedUsers.js";
import { userLookups } from "~tests/__helpers/FakeNamedUsers.js";
import type { FakeNamedUsersMode } from "~tests/__helpers/FakeNamedUsers.js";

/** Has a workflows permission, but no users permission, as a reviewer has. */
const REVIEWER_PERMISSIONS: SecurityPermission[] = [{ name: "workflows", reassign: true }];

interface SetupParams {
    permissions?: SecurityPermission[];
    mode?: FakeNamedUsersMode;
}

const setup = async (params: SetupParams = {}) => {
    const { context } = await createContextHandler({
        permissions: params.permissions,
        setup: container => {
            captureLoggedErrors(container);
            registerFakeNamedUsers(container, params.mode);
        }
    });
    return {
        container: context.container,
        resolveName: context.container.resolve(ResolveReviewUserNameUseCase)
    };
};

describe("ResolveReviewUserNameUseCase (R251, A90)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
        userLookups.length = 0;
    });

    it("returns the display name of a known user, and only the name", async () => {
        const { resolveName } = await setup();

        const name = expectOk(await resolveName.execute({ userId: KNOWN_USER_ID }));

        expect(name).toBe(KNOWN_USER_NAME);
        expect(userLookups.map(lookup => lookup.userId)).toEqual([KNOWN_USER_ID]);
        expect(loggedErrors).toEqual([]);
    });

    it("returns null for a user that does not exist, without a log", async () => {
        const { resolveName } = await setup();

        const name = expectOk(await resolveName.execute({ userId: "user-gone" }));

        expect(name).toBeNull();
        expect(loggedErrors).toEqual([]);
    });

    it("gives a viewer without the users permission the name, because the lookup runs without authorization", async () => {
        const { container, resolveName } = await setup({ permissions: REVIEWER_PERMISSIONS });
        const identityContext = container.resolve(IdentityContext);
        const direct = await container.resolve(GetUserUseCase).execute({ id: KNOWN_USER_ID });
        userLookups.length = 0;

        const name = expectOk(await resolveName.execute({ userId: OTHER_KNOWN_USER_ID }));

        expect(await identityContext.getPermission("adminUsers.user")).toBeNull();
        expect(direct.isFail()).toBe(true);
        expect(name).toBe(OTHER_KNOWN_USER_NAME);
    });

    it("wraps only the lookup in withoutAuthorization, once, and restores authorization", async () => {
        const { container, resolveName } = await setup({ permissions: REVIEWER_PERMISSIONS });
        const identityContext = container.resolve(IdentityContext);
        const withoutAuthorization = vi.spyOn(identityContext, "withoutAuthorization");

        expectOk(await resolveName.execute({ userId: KNOWN_USER_ID }));

        expect(withoutAuthorization).toHaveBeenCalledTimes(1);
        expect(userLookups).toEqual([{ userId: KNOWN_USER_ID, authorizationEnabled: false }]);
        expect(identityContext.isAuthorizationEnabled()).toBe(true);
    });

    it("fails with a persistence error, logged once, when the lookup throws", async () => {
        const { container, resolveName } = await setup({ mode: "throwing" });

        const result = await resolveName.execute({ userId: KNOWN_USER_ID });

        expect(result.isFail()).toBe(true);
        expect(result.isFail() && result.error).toBeInstanceOf(ReviewPersistenceError);
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe(
            "Could not look up the display name of a skipped user."
        );
        expect(container.resolve(IdentityContext).isAuthorizationEnabled()).toBe(true);
    });

    it("fails with a persistence error, logged once, when the lookup fails other than not found", async () => {
        const { resolveName } = await setup({ mode: "failing" });

        const result = await resolveName.execute({ userId: KNOWN_USER_ID });

        expect(result.isFail()).toBe(true);
        expect(result.isFail() && result.error).toBeInstanceOf(ReviewPersistenceError);
        expect(hasErrorSource(result.error) && result.error.source.message).toBe(
            "Storage is not available."
        );
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe(
            "Could not look up the display name of a skipped user."
        );
    });
});
