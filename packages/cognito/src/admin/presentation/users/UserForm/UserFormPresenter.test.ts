import { describe, it, expect, vi, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import { CreateUserFeature } from "~/admin/features/users/createUser/index.js";
import { LinkUserFeature } from "~/admin/features/users/linkUser/index.js";
import { CheckEmailFeature } from "~/admin/features/users/checkEmail/index.js";
import { UserFormFeature } from "./feature.js";
import { EMAIL_EXISTS_HERE } from "./UserFormPresenter.js";

const user = {
    id: "user-1",
    email: "person@example.com",
    firstName: "Some",
    lastName: "Person",
    avatar: null,
    createdOn: "2026-10-23T00:00:00.000Z",
    external: false
};

const emailStatus = (status: string) => {
    return { adminUsers: { checkEmail: { data: { status }, error: null } } };
};

const userResponse = (data: typeof user | null, error: Record<string, any> | null = null) => {
    return { adminUsers: { user: { data, error } } };
};

describe("UserFormPresenter: creating or linking a user", () => {
    let container: Container;
    let execute: ReturnType<typeof vi.fn>;

    const presenter = () => UserFormFeature.resolve(container).presenter;

    /** The GraphQL operations the presenter sent, by their operation name. */
    const operations = () => {
        return execute.mock.calls.map(([request]) => {
            return /(query|mutation) (\w+)/.exec(request.query)?.[2];
        });
    };

    beforeEach(() => {
        container = new Container();
        execute = vi.fn();
        container.registerInstance(MainGraphQLClient, {
            execute
        } as unknown as MainGraphQLClient.Interface);

        CreateUserFeature.register(container);
        LinkUserFeature.register(container);
        CheckEmailFeature.register(container);
        UserFormFeature.register(container);
    });

    it("starts in create mode", () => {
        expect(presenter().vm).toEqual({ mode: "create", emailError: null, saving: false });
    });

    it("stays in create mode for a new email", async () => {
        execute.mockResolvedValue(emailStatus("AVAILABLE"));
        const form = presenter();

        await form.checkEmail("new@example.com");

        expect(form.vm).toMatchObject({ mode: "create", emailError: null });
    });

    it("switches to link mode for an email with an account in another tenant", async () => {
        execute.mockResolvedValue(emailStatus("EXISTS_ELSEWHERE"));
        const form = presenter();

        await form.checkEmail("person@example.com");

        expect(form.vm).toMatchObject({ mode: "link", emailError: null });
    });

    it("shows an email error for a user already in this tenant", async () => {
        execute.mockResolvedValue(emailStatus("EXISTS_HERE"));
        const form = presenter();

        await form.checkEmail("person@example.com");

        expect(form.vm).toMatchObject({ mode: "create", emailError: EMAIL_EXISTS_HERE });
    });

    it("goes back to create mode when the email changes to a new one", async () => {
        execute.mockResolvedValueOnce(emailStatus("EXISTS_ELSEWHERE"));
        execute.mockResolvedValueOnce(emailStatus("AVAILABLE"));
        const form = presenter();

        await form.checkEmail("person@example.com");
        await form.checkEmail("someone-new@example.com");

        expect(form.vm).toMatchObject({ mode: "create", emailError: null });
    });

    it("doesn't check an incomplete email, or the same email twice", async () => {
        execute.mockResolvedValue(emailStatus("EXISTS_ELSEWHERE"));
        const form = presenter();

        await form.checkEmail("person@");
        await form.checkEmail("person@example.com");
        await form.checkEmail(" Person@example.com ");

        expect(operations()).toEqual(["CheckEmail"]);
        expect(form.vm.mode).toBe("link");
    });

    it("checks the email as typed, so a mixed-case email in this tenant is found", async () => {
        execute.mockResolvedValue(emailStatus("EXISTS_HERE"));
        const form = presenter();

        await form.checkEmail(" Foo@X.com ");

        expect(execute.mock.calls[0][0].variables).toEqual({ email: "Foo@X.com" });
        expect(form.vm).toMatchObject({ mode: "create", emailError: EMAIL_EXISTS_HERE });
    });

    it("keeps the latest email's result when an earlier check answers last", async () => {
        let answerFirst: (value: unknown) => void = () => {};
        execute.mockReturnValueOnce(new Promise(resolve => (answerFirst = resolve)));
        execute.mockResolvedValueOnce(emailStatus("AVAILABLE"));
        const form = presenter();

        const first = form.checkEmail("person@example.com");
        await form.checkEmail("someone-new@example.com");
        answerFirst(emailStatus("EXISTS_ELSEWHERE"));
        await first;

        expect(form.vm.mode).toBe("create");
    });

    it("stays in create mode when the check fails", async () => {
        execute.mockRejectedValue(new Error("Network error"));
        const form = presenter();

        await form.checkEmail("person@example.com");

        expect(form.vm).toMatchObject({ mode: "create", emailError: null });
    });

    it("creates the user in create mode", async () => {
        execute.mockResolvedValue(userResponse(user));
        const form = presenter();

        const result = await form.submit({
            email: user.email,
            firstName: "Some",
            lastName: "Person",
            password: "SecurePass123!"
        });

        expect(result).toEqual({ type: "created", user });
        expect(operations()).toEqual(["CreateUser"]);
    });

    it("links the account in link mode, sending only the email, roles and teams", async () => {
        execute.mockResolvedValueOnce(emailStatus("EXISTS_ELSEWHERE"));
        execute.mockResolvedValueOnce(userResponse(user));
        const form = presenter();
        await form.checkEmail(user.email);

        const result = await form.submit({
            email: user.email,
            firstName: "Typed",
            password: "Ignored123!",
            roles: [{ id: "editors" }],
            teams: []
        });

        expect(result).toEqual({ type: "linked", user });
        expect(operations()).toEqual(["CheckEmail", "LinkUser"]);
        expect(execute.mock.calls[1][0].variables).toEqual({
            data: { email: user.email, roles: [{ id: "editors" }], teams: [] }
        });
        expect(form.vm.saving).toBe(false);
    });

    it("switches to link mode when creating finds an account in another tenant", async () => {
        execute.mockResolvedValue(
            userResponse(null, {
                code: "Cognito/Account/ExistsInOtherTenant",
                message: "This email already has an account in another tenant. Link it instead.",
                data: null
            })
        );
        const form = presenter();

        const result = await form.submit({ email: user.email, password: "SecurePass123!" });

        expect(result).toEqual({ type: "linkRequired" });
        expect(form.vm).toMatchObject({ mode: "link", emailError: null, saving: false });

        // The email is known now, so leaving the field doesn't check it again.
        await form.checkEmail(user.email);
        expect(operations()).toEqual(["CreateUser"]);
    });

    it("reports any other error and stays in create mode", async () => {
        execute.mockResolvedValue(
            userResponse(null, { code: "AdminUser/Validation", message: "Invalid.", data: null })
        );
        const form = presenter();

        const result = await form.submit({ email: user.email, password: "SecurePass123!" });

        expect(result).toEqual({ type: "failed", message: "Invalid." });
        expect(form.vm.mode).toBe("create");
    });

    it("starts over in create mode after a reset", async () => {
        execute.mockResolvedValue(emailStatus("EXISTS_ELSEWHERE"));
        const form = presenter();
        await form.checkEmail(user.email);

        form.reset();

        expect(form.vm).toEqual({ mode: "create", emailError: null, saving: false });
    });
});
