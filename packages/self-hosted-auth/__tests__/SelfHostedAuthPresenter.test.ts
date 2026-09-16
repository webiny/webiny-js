import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Container } from "@webiny/feature/admin";
import { LogInUseCase } from "@webiny/app-admin/features/security/LogIn/index.js";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/index.js";
import { SelfHostedAuthGateway } from "~/admin/gateways/SelfHostedAuthGateway.js";
import { SelfHostedAuthPresenter } from "~/admin/presentation/abstractions.js";
import { SelfHostedAuthFeature } from "~/admin/presentation/feature.js";

const EMAIL = "admin@example.com";

/**
 * The flow, driven without rendering anything. All four screens share one presenter, so the things
 * worth pinning are the moves between them and what the user is told on arrival.
 *
 * The gateway is stubbed rather than `fetch`: since the requests moved behind it, these cases can
 * say what the API answered without saying how it was asked.
 */

interface CannedResult {
    data?: unknown;
    error?: { code: string; message: string } | null;
}

/** One canned answer per gateway call, keyed by the method the presenter reaches for. */
type CannedResults = Partial<Record<keyof SelfHostedAuthGateway.Interface, CannedResult>>;

const store = new Map<string, string>();

beforeEach(() => {
    store.clear();

    vi.stubGlobal("window", {
        localStorage: {
            getItem: (key: string) => store.get(key) ?? null,
            setItem: (key: string, value: string) => store.set(key, value),
            removeItem: (key: string) => store.delete(key)
        }
    });
});

afterEach(() => {
    vi.unstubAllGlobals();
});

const setup = (options: { passwordResetEnabled?: boolean; results?: CannedResults } = {}) => {
    const container = new Container();

    const logIn = vi.fn(async () => undefined);

    const answers = (name: keyof SelfHostedAuthGateway.Interface) => {
        return vi.fn(async () => {
            const canned = options.results?.[name];
            if (!canned) {
                throw new Error(`No canned result for gateway.${name}`);
            }

            return { data: canned.data ?? null, error: canned.error ?? null };
        });
    };

    const gateway = {
        signIn: answers("signIn"),
        requestResetCode: answers("requestResetCode"),
        resetPassword: answers("resetPassword")
    };

    container.registerInstance(SelfHostedAuthGateway, gateway as never);

    container.registerInstance(IdentityContext, {
        getIdentity: () => ({ isAuthenticated: false })
    } as never);

    container.registerInstance(LogInUseCase, { execute: logIn } as never);

    SelfHostedAuthFeature.register(container);

    const presenter = container.resolve(SelfHostedAuthPresenter);

    presenter.init({ passwordResetEnabled: options.passwordResetEnabled ?? true });

    return { presenter, logIn, gateway };
};

const codeSent = { results: { requestResetCode: { data: true } } };

describe("SelfHostedAuthPresenter", () => {
    it("starts on sign in", () => {
        const { presenter } = setup();

        expect(presenter.vm.screen).toBe("signIn");
    });

    it("offers the reset flow only when the project left it on", () => {
        expect(setup().presenter.vm.signIn.passwordResetEnabled).toBe(true);
        expect(
            setup({ passwordResetEnabled: false }).presenter.vm.signIn.passwordResetEnabled
        ).toBe(false);
    });

    it("walks from sign in to the code screen and back", async () => {
        const { presenter } = setup(codeSent);

        presenter.showRequestResetCode();
        expect(presenter.vm.screen).toBe("requestResetCode");

        await presenter.requestResetCode(EMAIL);
        expect(presenter.vm.screen).toBe("resetCodeSent");

        presenter.showSetNewPassword();
        expect(presenter.vm.screen).toBe("setNewPassword");

        presenter.showSignIn();
        expect(presenter.vm.screen).toBe("signIn");
    });

    it("asks the gateway for a code for the address it was given", async () => {
        const { presenter, gateway } = setup(codeSent);

        await presenter.requestResetCode(EMAIL);

        expect(gateway.requestResetCode).toHaveBeenCalledWith({ email: EMAIL });
    });

    it("names the address the code went to, so the user knows which inbox to open", async () => {
        const { presenter } = setup(codeSent);

        await presenter.requestResetCode(EMAIL);

        expect(presenter.vm.resetCodeSent.email).toBe(EMAIL);
    });

    /**
     * The API answers identically for an address with an account and one without, so the screen has
     * to as well. A message that said "no such user" would give away exactly what the API refuses
     * to.
     */
    it("says the same thing whether or not the address has an account", async () => {
        const { presenter } = setup(codeSent);

        await presenter.requestResetCode(EMAIL);
        const known = presenter.vm.resetCodeSent.message;

        presenter.showSignIn();
        await presenter.requestResetCode("nobody@example.com");
        const unknown = presenter.vm.resetCodeSent.message;

        expect(known?.type).toBe(unknown?.type);
        expect(known?.title).toBe(unknown?.title);
    });

    it("stays put and explains when the installation cannot send mail", async () => {
        const { presenter } = setup({
            results: {
                requestResetCode: {
                    error: {
                        code: "MAILER_NOT_CONFIGURED",
                        message: "... run `yarn webiny reset-password <email>` ..."
                    }
                }
            }
        });

        presenter.showRequestResetCode();

        await presenter.requestResetCode(EMAIL);

        expect(presenter.vm.screen).toBe("requestResetCode");
        expect(presenter.vm.requestResetCode.message?.type).toBe("warning");
        expect(presenter.vm.requestResetCode.message?.text).toContain("webiny reset-password");
    });

    it("keeps the user on the code screen when the code is refused", async () => {
        const { presenter } = setup({
            results: {
                resetPassword: {
                    error: {
                        code: "INVALID_RESET_CODE",
                        message: "The code is invalid or expired."
                    }
                }
            }
        });

        presenter.showSetNewPassword();

        await presenter.resetPassword("000000", "long-enough-password");

        expect(presenter.vm.screen).toBe("setNewPassword");
        expect(presenter.vm.setNewPassword.message?.type).toBe("danger");
    });

    it("returns to sign in with a success note once the password is changed", async () => {
        const { presenter } = setup({ results: { resetPassword: { data: true } } });

        presenter.showSetNewPassword();

        await presenter.resetPassword("424242", "long-enough-password");

        expect(presenter.vm.screen).toBe("signIn");
        expect(presenter.vm.signIn.message?.type).toBe("success");
    });

    it("signs in and hands the token to app-admin", async () => {
        const { presenter, logIn } = setup({
            results: { signIn: { data: { token: "a-jwt", expiresIn: 3600 } } }
        });

        await presenter.signIn(EMAIL, "long-enough-password");

        expect(logIn).toHaveBeenCalled();
        expect(store.get("webiny_self_hosted_auth_token")).toBe("a-jwt");
    });

    it("reports a refused sign in without storing anything", async () => {
        const { presenter, logIn } = setup({
            results: {
                signIn: { error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials." } }
            }
        });

        await presenter.signIn(EMAIL, "wrong");

        expect(presenter.vm.signIn.message?.type).toBe("danger");
        expect(logIn).not.toHaveBeenCalled();
        expect(store.has("webiny_self_hosted_auth_token")).toBe(false);
    });

    /**
     * Each screen shows only its own message. Without this, a failure on one screen would follow
     * the user to the next one and read as though it had just happened again.
     */
    it("does not carry a message from one screen to another", async () => {
        const { presenter } = setup({
            results: {
                signIn: { error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials." } }
            }
        });

        await presenter.signIn(EMAIL, "wrong");

        presenter.showRequestResetCode();

        expect(presenter.vm.requestResetCode.message).toBeNull();
    });
});
