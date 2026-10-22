import { describe, it, expect, vi, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import { CreateUserFeature } from "./feature.js";

const user = {
    id: "user-1",
    email: "person@example.com",
    firstName: "Some",
    lastName: "Person",
    avatar: null,
    createdOn: "2026-10-22T00:00:00.000Z",
    external: false
};

describe("CreateUser feature", () => {
    let container: Container;
    let execute: ReturnType<typeof vi.fn>;

    const createUser = () => {
        const { useCase } = CreateUserFeature.resolve(container);
        return useCase.execute({ data: { email: user.email, password: "SecurePass123!" } });
    };

    beforeEach(() => {
        container = new Container();
        execute = vi.fn();
        container.registerInstance(MainGraphQLClient, {
            execute
        } as unknown as MainGraphQLClient.Interface);
        CreateUserFeature.register(container);
    });

    it("tells when the email's existing account was added to this tenant", async () => {
        execute.mockResolvedValue({
            adminUsers: { user: { data: user, error: null, existingAccount: true } }
        });

        expect(await createUser()).toEqual({ ...user, existingAccount: true });
    });

    it("reports a new account as not existing", async () => {
        execute.mockResolvedValue({
            adminUsers: { user: { data: user, error: null, existingAccount: false } }
        });

        expect(await createUser()).toEqual({ ...user, existingAccount: false });
    });

    it("throws the API's error message", async () => {
        execute.mockResolvedValue({
            adminUsers: {
                user: {
                    data: null,
                    error: { code: "Cognito/Account/Exists", message: "Already here.", data: null },
                    existingAccount: null
                }
            }
        });

        await expect(createUser()).rejects.toThrow("Already here.");
    });
});
