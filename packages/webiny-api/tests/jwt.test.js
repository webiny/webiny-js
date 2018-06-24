import { Entity, api } from "webiny-api";
import addDays from "date-fns/add_days";
import subDays from "date-fns/sub_days";
import { MemoryDriver } from "webiny-entity-memory";

import MyUser from "./entities/myUser";
import JwtToken from "../src/security/tokens/jwtToken";
import AuthenticationError from "../src/security/AuthenticationError";
import registerIdentityAttribute from "./../src/attributes/registerIdentityAttribute";
import registerPasswordAttribute from "./../src/attributes/registerPasswordAttribute";
import SecurityService from "../src/services/securityService";

describe("JWT token test", () => {
    let user: MyUser = null;
    let user2: MyUser = null;
    beforeAll(async () => {
        // Register service (for identity attribute).
        api.services.register("security", () => {
            return new SecurityService({
                token: new JwtToken({ secret: "MyS3cr3tK3Y" }),
                identities: [
                    {
                        identity: MyUser
                    }
                ]
            });
        });

        // Register attributes.
        registerIdentityAttribute();
        registerPasswordAttribute();

        // Configure Memory entity driver.
        Entity.driver = new MemoryDriver();

        // Insert test users.
        user = new MyUser();
        user.populate({ username: "admin@webiny.com", password: "dev" });
        user2 = new MyUser();
        user2.populate({ username: "test@webiny.com", password: "admin" });

        return Promise.all([user.save(), user2.save()]);
    });

    it("should encode and decode a JWT token", async () => {
        const token = new JwtToken({ secret: "MyS3cr3tK3Y" });
        // encode
        const expiresOn = Math.floor(addDays(new Date(), 1).getTime() / 1000);
        let jwt = await token.encode(user, expiresOn);
        expect(typeof jwt === "string").toBe(true);

        // decode
        return token.decode(jwt).then(({ data, exp }) => {
            expect(exp).toBe(expiresOn);
            expect(data).toEqual({ identityId: user.id, classId: MyUser.classId });
        });
    });

    it("should create tokens with custom data", async () => {
        const token = new JwtToken({
            secret: "MyS3cr3tK3Y",
            data: (identity: MyUser) => {
                return Promise.resolve({
                    identityId: identity.id,
                    classId: identity.classId,
                    custom: "data"
                });
            }
        });

        const expiresOn = Math.floor(addDays(new Date(), 1).getTime() / 1000);
        let jwt = await token.encode(user, expiresOn);
        return token.decode(jwt).then(({ data }) => {
            expect(data).toEqual({
                identityId: user.id,
                classId: MyUser.classId,
                custom: "data"
            });
        });
    });

    it("should reject with TOKEN_INVALID", async () => {
        const token = new JwtToken({ secret: "MyS3cr3tK3Y" });
        return token.decode("123").catch(e => {
            expect(e).toBeInstanceOf(AuthenticationError);
            expect(e.code).toBe(AuthenticationError.TOKEN_INVALID);
        });
    });

    it("should reject with TOKEN_EXPIRED", async () => {
        const token = new JwtToken({ secret: "MyS3cr3tK3Y" });
        // encode
        const expiresOn = Math.floor(subDays(new Date(), 1).getTime() / 1000);
        let jwt = await token.encode(user, expiresOn);
        expect(typeof jwt).toBe("string");

        // decode
        return token.decode(jwt).catch(err => {
            expect(err.code).toBe(AuthenticationError.TOKEN_EXPIRED);
        });
    });
});
