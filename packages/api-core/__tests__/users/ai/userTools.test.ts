import { describe, it, expect } from "vitest";
import type { Container } from "@webiny/di";
import { CreateUserUseCase } from "~/features/users/CreateUser/index.js";
import { DeleteUserUseCase } from "~/features/users/DeleteUser/index.js";
import { GetUserUseCase } from "~/features/users/GetUser/index.js";
import { ListRolesUseCase } from "~/features/security/roles/ListRoles/index.js";
import {
    USER_CREATED_WEBSOCKET_ACTION,
    USER_DELETED_WEBSOCKET_ACTION,
    USER_UPDATED_WEBSOCKET_ACTION
} from "~/features/users/NotifyUserChange/index.js";
import { getTool, useToolHandler } from "../../security/ai/useToolHandler";

// The identity TestAuthenticator signs every request in as.
const SIGNED_IN_ID = "123456789";

const createUser = async (
    container: Container,
    input: { email: string; id?: string; external?: boolean; roles?: string[] }
) => {
    const result = await container.resolve(CreateUserUseCase).execute(input);
    if (result.isFail()) {
        throw new Error(result.error.message);
    }
    return result.value;
};

const fullAccessRole = async (container: Container) => {
    const result = await container.resolve(ListRolesUseCase).execute();
    const role = result.isOk() ? result.value.find(r => r.slug === "full-access") : undefined;
    if (!role) {
        throw new Error("The install did not create the full-access role.");
    }
    return role;
};

const storedRoles = async (container: Container, id: string) => {
    const result = await container.resolve(GetUserUseCase).execute({ id });
    return result.isOk() ? result.value.roles : undefined;
};

describe("user tools and change notifications", () => {
    const { handler, websocketMessages } = useToolHandler();

    it("should tell the user's tabs about a created and a deleted user", async () => {
        const { container } = await handler();
        websocketMessages.length = 0;

        const user = await createUser(container, { email: "created@webiny.com" });
        await container.resolve(DeleteUserUseCase).execute(user.id);

        expect(websocketMessages).toEqual([
            {
                identityId: SIGNED_IN_ID,
                action: USER_CREATED_WEBSOCKET_ACTION,
                data: { id: user.id }
            },
            {
                identityId: SIGNED_IN_ID,
                action: USER_DELETED_WEBSOCKET_ACTION,
                data: { id: user.id }
            }
        ]);
    });

    it("should list users with their role and team ids", async () => {
        const { container } = await handler();
        const role = await fullAccessRole(container);
        const user = await createUser(container, { email: "listed@webiny.com", roles: [role.id] });

        const listed = (await getTool(container, "listUsers").execute({})) as unknown[];

        expect(listed).toContainEqual({
            id: user.id,
            displayName: user.displayName,
            email: "listed@webiny.com",
            roles: [role.id],
            teams: []
        });
    });

    it("should store a role given by slug as its id, and tell the user's tabs", async () => {
        const { container } = await handler();
        const role = await fullAccessRole(container);
        const user = await createUser(container, { email: "slug@webiny.com" });
        websocketMessages.length = 0;

        const updated = await getTool(container, "updateUserAccess").execute({
            userId: user.id,
            email: "slug@webiny.com",
            roles: ["full-access"]
        });

        expect(updated).toEqual({
            id: user.id,
            email: "slug@webiny.com",
            roles: [role.id],
            teams: []
        });
        expect(await storedRoles(container, user.id)).toEqual([role.id]);
        expect(websocketMessages).toEqual([
            {
                identityId: SIGNED_IN_ID,
                action: USER_UPDATED_WEBSOCKET_ACTION,
                data: { id: user.id }
            }
        ]);
    });

    it("should refuse an unknown role and store nothing", async () => {
        const { container } = await handler();
        const user = await createUser(container, { email: "unknown@webiny.com" });
        websocketMessages.length = 0;

        await expect(
            getTool(container, "updateUserAccess").execute({
                userId: user.id,
                email: "unknown@webiny.com",
                roles: ["editors"]
            })
        ).rejects.toThrow('Not a known role id or slug: "editors"');
        expect(await storedRoles(container, user.id)).toEqual([]);
        expect(websocketMessages).toEqual([]);
    });

    it("should refuse when the email does not match the stored user", async () => {
        const { container } = await handler();
        const user = await createUser(container, { email: "right@webiny.com" });

        await expect(
            getTool(container, "updateUserAccess").execute({
                userId: user.id,
                email: "wrong@webiny.com",
                roles: []
            })
        ).rejects.toThrow('has the email "right@webiny.com", not "wrong@webiny.com"');
    });

    it("should refuse to change the signed-in user's own access", async () => {
        const { container } = await handler();
        const role = await fullAccessRole(container);
        await createUser(container, {
            id: SIGNED_IN_ID,
            email: "me@webiny.com",
            roles: [role.id]
        });

        await expect(
            getTool(container, "updateUserAccess").execute({
                userId: SIGNED_IN_ID,
                email: "me@webiny.com",
                roles: []
            })
        ).rejects.toThrow("This is the signed-in user.");
        expect(await storedRoles(container, SIGNED_IN_ID)).toEqual([role.id]);
    });

    it("should refuse a user from an external identity provider", async () => {
        const { container } = await handler();
        const user = await createUser(container, { email: "okta@webiny.com", external: true });

        await expect(
            getTool(container, "updateUserAccess").execute({
                userId: user.id,
                email: "okta@webiny.com",
                roles: ["full-access"]
            })
        ).rejects.toThrow("signs in through an external identity provider");
        expect(await storedRoles(container, user.id)).toEqual([]);
    });
});
