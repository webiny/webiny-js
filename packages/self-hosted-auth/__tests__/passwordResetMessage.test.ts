import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createPasswordResetMessage } from "~/api/domain/mail/passwordResetMessage.js";

describe("createPasswordResetMessage", () => {
    it("addresses the code to the account and leaves the sender to the transport", () => {
        const message = createPasswordResetMessage({ email: "admin@example.com", code: "123456" });

        expect(message).toEqual({
            to: ["admin@example.com"],
            subject: "Your password reset code",
            text: expect.stringContaining("Your password reset code is 123456.")
        });
        expect(message).not.toHaveProperty("from");
    });
});
