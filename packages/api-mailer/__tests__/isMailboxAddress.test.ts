import { describe, it, expect } from "vitest";
import { isMailboxAddress } from "~/utils/isMailboxAddress.js";

describe("isMailboxAddress", () => {
    it.each([
        "foo@bar.com",
        "first.last@example.co.uk",
        "user+tag@example.com",
        "Foo <foo@bar.com>",
        "Foo Bar <foo.bar@example.com>",
        '"Foo, Bar" <foo@example.com>',
        "Webiny <noreply@example.com>"
    ])("accepts %s", value => {
        expect(isMailboxAddress(value)).toBe(true);
    });

    it.each(["", " ", "not-an-email", "@example.com", "foo@", "Foo <not-an-email>", "<>"])(
        "rejects %s",
        value => {
            expect(isMailboxAddress(value)).toBe(false);
        }
    );
});
