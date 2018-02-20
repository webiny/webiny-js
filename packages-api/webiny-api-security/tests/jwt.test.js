// @flow
import { Entity } from "webiny-api";
import addDays from "date-fns/add_days";
import subDays from "date-fns/sub_days";
import { MemoryDriver } from "webiny-entity-memory";

import MyEntity from "./entities/myEntity";
import JwtToken from "../src/tokens/jwtToken";
import AuthenticationError from "../src/services/authenticationError";
import chai from "./utils/chai";

const { expect } = chai;

describe("JWT token test", () => {
    let user: MyEntity = null;

    before(() => {
        Entity.driver = new MemoryDriver();
        user = new MyEntity();
        user.flag = true;
        return user.save();
    });

    it("should encode and decode a JWT token", async () => {
        const token = new JwtToken({ secret: "MyS3cr3tK3Y" });
        // encode
        const expiresOn = Math.floor(addDays(new Date(), 1).getTime() / 1000);
        let jwt = await token.encode(user, expiresOn);
        expect(jwt).to.be.a("string");

        // decode
        return token.decode(jwt).then(({ data, exp }) => {
            expect(exp).to.equal(expiresOn);
            expect(data).to.deep.equal({ identityId: user.id, classId: MyEntity.classId });
        });
    });

    it("should create tokens that expire in 1 day", async () => {
        const in1Day = Math.floor(addDays(new Date(), 1).getTime() / 1000);
        const token = new JwtToken({
            secret: "MyS3cr3tK3Y",
            expiresOn: (identity: MyEntity) => in1Day
        });

        let jwt = await token.encode(user);
        return token.decode(jwt).then(({ data, exp }) => {
            expect(exp).to.equal(in1Day);
            expect(data).to.deep.equal({ identityId: user.id, classId: MyEntity.classId });
        });
    });

    it("should create tokens with custom data", async () => {
        const token = new JwtToken({
            secret: "MyS3cr3tK3Y",
            data: (identity: MyEntity) => {
                return Promise.resolve({
                    identityId: identity.id,
                    classId: identity.classId,
                    flag: user.flag,
                    custom: "data"
                });
            }
        });

        let jwt = await token.encode(user);
        return token.decode(jwt).then(({ data }) => {
            expect(data).to.deep.equal({
                identityId: user.id,
                classId: MyEntity.classId,
                flag: true,
                custom: "data"
            });
        });
    });

    it("should reject with TOKEN_INVALID", async () => {
        const token = new JwtToken({ secret: "MyS3cr3tK3Y" });
        expect(token.decode("123"))
            .to.be.rejectedWith(AuthenticationError)
            .then(err => {
                expect(err.type).to.equal(AuthenticationError.TOKEN_INVALID);
            });
    });

    it("should reject with TOKEN_EXPIRED", async () => {
        const token = new JwtToken({ secret: "MyS3cr3tK3Y" });
        // encode
        const expiresOn = Math.floor(subDays(new Date(), 1).getTime() / 1000);
        let jwt = await token.encode(user, expiresOn);
        expect(jwt).to.be.a("string");

        // decode
        expect(token.decode(jwt))
            .to.be.rejectedWith(AuthenticationError)
            .then(err => {
                expect(err.type).to.equal(AuthenticationError.TOKEN_EXPIRED);
            });
    });
});
