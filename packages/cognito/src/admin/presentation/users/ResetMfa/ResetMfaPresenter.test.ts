import { describe, it, expect, vi, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import { ResetUserMfaFeature } from "~/admin/features/users/resetUserMfa/index.js";
import { ResetMfaFeature } from "./feature.js";

const user = { id: "user-1", email: "person@example.com", external: false };

const resetResponse = (error: Record<string, any> | null = null) => {
    return { adminUsers: { resetUserMfa: { data: error ? null : true, error } } };
};

describe("ResetMfaPresenter: resetting a user's MFA", () => {
    let container: Container;
    let execute: ReturnType<typeof vi.fn>;

    const presenter = () => ResetMfaFeature.resolve(container).presenter;

    beforeEach(() => {
        container = new Container();
        execute = vi.fn();
        container.registerInstance(MainGraphQLClient, {
            execute
        } as unknown as MainGraphQLClient.Interface);

        ResetUserMfaFeature.register(container);
        ResetMfaFeature.register(container);
    });

    it("offers the reset for another user who signs in with Cognito", () => {
        const resetMfa = presenter();

        resetMfa.init({ user, currentIdentityId: "admin-1" });

        expect(resetMfa.vm).toEqual({ available: true, resetting: false });
    });

    it("doesn't offer the reset for a federated user", () => {
        const resetMfa = presenter();

        resetMfa.init({ user: { ...user, external: true }, currentIdentityId: "admin-1" });

        expect(resetMfa.vm.available).toBe(false);
    });

    it("doesn't offer the reset for yourself", () => {
        const resetMfa = presenter();

        resetMfa.init({ user, currentIdentityId: user.id });

        expect(resetMfa.vm.available).toBe(false);
    });

    it("doesn't offer the reset without a user", () => {
        const resetMfa = presenter();

        resetMfa.init({ user: undefined, currentIdentityId: "admin-1" });

        expect(resetMfa.vm.available).toBe(false);
    });

    it("resets the user's MFA and says they'll set it up on their next sign-in", async () => {
        execute.mockResolvedValue(resetResponse());
        const resetMfa = presenter();
        resetMfa.init({ user, currentIdentityId: "admin-1" });

        const result = await resetMfa.reset();

        expect(result).toEqual({
            type: "reset",
            message:
                "MFA reset for person@example.com. They'll set it up again on their next sign-in."
        });
        expect(execute).toHaveBeenCalledTimes(1);
        expect(execute.mock.calls[0][0].variables).toEqual({ id: user.id });
        expect(resetMfa.vm.resetting).toBe(false);
    });

    it("shows that it's resetting while the request runs", async () => {
        let answer: (value: unknown) => void = () => {};
        execute.mockReturnValue(new Promise(resolve => (answer = resolve)));
        const resetMfa = presenter();
        resetMfa.init({ user, currentIdentityId: "admin-1" });

        const result = resetMfa.reset();
        expect(resetMfa.vm.resetting).toBe(true);

        answer(resetResponse());
        await result;
        expect(resetMfa.vm.resetting).toBe(false);
    });

    it("reports the API's error", async () => {
        execute.mockResolvedValue(
            resetResponse({
                code: "Cognito/User/ResetMfa",
                message: "Failed to reset the user's MFA in Cognito: User has no software token.",
                data: null
            })
        );
        const resetMfa = presenter();
        resetMfa.init({ user, currentIdentityId: "admin-1" });

        const result = await resetMfa.reset();

        expect(result).toEqual({
            type: "failed",
            message: "Failed to reset the user's MFA in Cognito: User has no software token."
        });
        expect(resetMfa.vm.resetting).toBe(false);
    });

    it("doesn't send a reset for a user it isn't offered for", async () => {
        const resetMfa = presenter();
        resetMfa.init({ user: { ...user, external: true }, currentIdentityId: "admin-1" });

        const result = await resetMfa.reset();

        expect(result.type).toBe("failed");
        expect(execute).not.toHaveBeenCalled();
    });
});
