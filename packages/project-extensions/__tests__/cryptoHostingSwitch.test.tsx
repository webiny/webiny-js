import type React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Encryption as AwsEncryption } from "@webiny/project-extensions-aws/extensions/index.js";
import { Hashing as AwsHashing } from "@webiny/project-extensions-aws/extensions/index.js";
import { Encryption as StandaloneEncryption } from "@webiny/project-extensions-standalone/extensions/index.js";
import { Hashing as StandaloneHashing } from "@webiny/project-extensions-standalone/extensions/index.js";
import { Infra } from "~/namespaces/infra.js";

/*
 * Calls the namespace member as a function: the returned element shows which hosting type's
 * version it renders.
 */
const renderedComponent = (Component: React.ComponentType<any>, props: Record<string, unknown>) => {
    const render = Component as unknown as (props: Record<string, unknown>) => React.ReactElement;
    const element = render(props);
    return element.type;
};

describe("Infra.Crypto per hosting type", () => {
    const originalHostingType = process.env.WEBINY_HOSTING_TYPE;

    afterEach(() => {
        if (originalHostingType === undefined) {
            delete process.env.WEBINY_HOSTING_TYPE;
        } else {
            process.env.WEBINY_HOSTING_TYPE = originalHostingType;
        }
    });

    it("renders the AWS versions in an AWS project", () => {
        process.env.WEBINY_HOSTING_TYPE = "aws";
        const encryption = renderedComponent(Infra.Crypto.Encryption, { passphrase: "x" });
        const hashing = renderedComponent(Infra.Crypto.Hashing, { pepper: "x" });

        expect(encryption).toBe(AwsEncryption);
        expect(hashing).toBe(AwsHashing);
    });

    it("renders the standalone versions in a standalone project", () => {
        process.env.WEBINY_HOSTING_TYPE = "standalone";
        const encryption = renderedComponent(Infra.Crypto.Encryption, { passphrase: "x" });
        const hashing = renderedComponent(Infra.Crypto.Hashing, { pepper: "x" });

        expect(encryption).toBe(StandaloneEncryption);
        expect(hashing).toBe(StandaloneHashing);
    });

    it("renders the AWS versions when the hosting type isn't set", () => {
        delete process.env.WEBINY_HOSTING_TYPE;
        const encryption = renderedComponent(Infra.Crypto.Encryption, { passphrase: "x" });

        expect(encryption).toBe(AwsEncryption);
    });
});
