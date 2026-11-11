import { describe, expect, it } from "vitest";
import { Container } from "@webiny/feature/api";
import { Authorizer } from "@webiny/api-core/features/security/authorization/Authorizer/index.js";
import { AuthenticatedIdentity } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import {
    TestAuthorizer,
    TestIdentity,
    TestPermissions,
    type TestPermissionsHolder
} from "@webiny/api-core-testing";

const REQUEST_PERMISSIONS: SecurityPermission[] = [{ name: "workflows", editor: true }];
const LISTED_PERMISSIONS: SecurityPermission[] = [{ name: "workflows", reassign: true }];

const createIdentity = (id: string): AuthenticatedIdentity => {
    return new AuthenticatedIdentity({ id, displayName: id, type: "admin" });
};

const createAuthorizer = (holder: TestPermissionsHolder): Authorizer.Interface => {
    const container = new Container();
    container.registerInstance(TestIdentity, createIdentity("request-user"));
    container.registerInstance(TestPermissions, holder);
    container.register(TestAuthorizer);
    return container.resolve(Authorizer);
};

describe("TestAuthorizer permissions of other identities (R70)", () => {
    const holder: TestPermissionsHolder = {
        list: REQUEST_PERMISSIONS,
        byIdentity: { "listed-user": LISTED_PERMISSIONS }
    };

    it("gives an identity listed in byIdentity its own permissions", async () => {
        const authorizer = createAuthorizer(holder);

        expect(await authorizer.authorize(createIdentity("listed-user"))).toEqual(
            LISTED_PERMISSIONS
        );
    });

    it("gives an unlisted identity other than the request identity no permissions", async () => {
        const authorizer = createAuthorizer(holder);

        expect(await authorizer.authorize(createIdentity("unlisted-user"))).toEqual([]);
    });

    it("gives no permissions to other identities when byIdentity is not set", async () => {
        const authorizer = createAuthorizer({ list: REQUEST_PERMISSIONS });

        expect(await authorizer.authorize(createIdentity("other-user"))).toEqual([]);
    });

    it("keeps the permissions of the request identity", async () => {
        const authorizer = createAuthorizer(holder);

        expect(await authorizer.authorize(createIdentity("request-user"))).toEqual(
            REQUEST_PERMISSIONS
        );
    });
});
