import request from "supertest";
import express from "express";
import addDays from "date-fns/add_days";
import { assert, expect } from "chai";
import { MemoryDriver } from "webiny-entity-memory";
import api, { middleware, endpointMiddleware, Entity } from "webiny-api";
import {
    authenticationMiddleware,
    authorizationMiddleware,
    credentialsStrategy,
    JwtToken,
    SecurityApp
} from "./../src";
import MyUser from "./entities/myUser";
import MyCompany from "./entities/myCompany";
import { User } from "./entities/identityAttributeEntities";

import sinon from "sinon";

const sandbox = sinon.sandbox.create();

describe("Security test", () => {
    afterEach(() => sandbox.restore());

    let app = null;
    let user;
    let company;

    before(() => {
        app = express();
        app.use(express.json());
        app.use(
            middleware({
                apps: [
                    new SecurityApp({
                        authentication: {
                            token: new JwtToken({ secret: "MyS3cr3tK3Y" }),
                            strategies: {
                                credentials: credentialsStrategy(),
                                companyCredentials: credentialsStrategy({
                                    usernameAttribute: "companyId",
                                    credentials: req => {
                                        return {
                                            username: req.body.companyId,
                                            password: req.body.password
                                        };
                                    }
                                })
                            },
                            identities: [
                                {
                                    identity: MyUser,
                                    authenticate: [
                                        {
                                            strategy: "credentials",
                                            expiresOn: () => addDays(new Date(), 30),
                                            apiMethod: {
                                                name: "Auth.MyUser.Login",
                                                pattern: "/login-user"
                                            }
                                        }
                                    ]
                                },
                                {
                                    identity: MyCompany,
                                    authenticate: [
                                        {
                                            strategy: "companyCredentials",
                                            expiresOn: () => addDays(new Date(), 30),
                                            apiMethod: {
                                                name: "Auth.MyCompany.Login",
                                                pattern: "/login-company"
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    })
                ],
                use: [
                    authenticationMiddleware({ token: req => req.get("Api-Token") }),
                    // Create a second middleware which should do the same thing but using a fixed header name
                    authenticationMiddleware({ token: "Api-Token" }),
                    endpointMiddleware({
                        beforeApiMethod: [authorizationMiddleware()]
                    })
                ]
            })
        );

        // Configure Memory entity driver
        Entity.driver = new MemoryDriver();
        // Insert test user
        user = new MyUser();
        user.populate({ username: "admin@webiny.com", password: "dev" });
        company = new MyCompany();
        company.populate({ companyId: "ABC", password: "dev" });
        return Promise.all([user.save(), company.save()]);
    });

    it("should return error response with WBY_NOT_AUTHENTICATED", () => {
        return request(app)
            .get("/security/auth/me")
            .expect(401)
            .then(({ body }) => {
                expect(body).to.have.property("code", "WBY_NOT_AUTHENTICATED");
            });
    });

    it("should return error response with WBY_INVALID_CREDENTIALS", () => {
        return request(app)
            .post("/security/auth/login-user")
            .query({ _fields: "id,username" })
            .send({ username: "admin@webiny.com", password: "wrong" })
            .expect(401)
            .then(({ body }) => {
                expect(body).to.have.property("code", "WBY_INVALID_CREDENTIALS");
            });
    });

    it("should return error response with WBY_INTERNAL_ERROR", () => {
        const authService = api.services.get("authentication");
        sandbox.stub(authService, "authenticate").callsFake(() => {
            return {
                promise: () => {
                    return Promise.reject(new Error("Arbitrary error"));
                }
            };
        });

        return request(app)
            .post("/security/auth/login-user")
            .query({ _fields: "id,username" })
            .send({ username: "admin@webiny.com", password: "wrong" })
            .expect(500)
            .then(({ body }) => {
                expect(body).to.have.property("code", "WBY_INTERNAL_ERROR");
                authService.authenticate.restore();
            });
    });

    it("should authenticate user identity", () => {
        return request(app)
            .post("/security/auth/login-user")
            .query({ _fields: "id,username" })
            .send({ username: "admin@webiny.com", password: "dev" })
            .expect(200)
            .then(({ body }) => {
                expect(body.data).to.have.property("token");
                expect(body.data).to.have.property("identity");
                expect(body.data.identity).to.deep.equal({ id: user.id, username: user.username });
            });
    });

    it("should authenticate user identity using token", () => {
        return request(app)
            .post("/security/auth/login-user")
            .query({ _fields: "id,username" })
            .send({ username: "admin@webiny.com", password: "dev" })
            .expect(200)
            .then(({ body }) => {
                return request(app)
                    .get("/security/auth/me")
                    .set({ "Api-Token": body.data.token })
                    .query({ _fields: "id,username" })
                    .expect(200)
                    .then(({ body }) => {
                        expect(body.data).to.have.property("id", user.id);
                        expect(body.data).to.have.property("username", user.username);
                    });
            });
    });

    it("should authenticate company identity", () => {
        return request(app)
            .post("/security/auth/login-company")
            .query({ _fields: "id,companyId" })
            .send({ companyId: "ABC", password: "dev" })
            .expect(200)
            .then(({ body }) => {
                expect(body.data).to.have.property("token");
                expect(body.data).to.have.property("identity");
                expect(body.data.identity).to.deep.equal({
                    id: company.id,
                    companyId: company.companyId
                });
            });
    });

    it("should authenticate company identity using token", () => {
        return request(app)
            .post("/security/auth/login-company")
            .send({ companyId: "ABC", password: "dev" })
            .expect(200)
            .then(({ body }) => {
                return request(app)
                    .get("/security/auth/me")
                    .set({ "Api-Token": body.data.token })
                    .query({ _fields: "id,companyId" })
                    .expect(200)
                    .then(({ body }) => {
                        expect(body.data).to.have.property("id", company.id);
                        expect(body.data).to.have.property("companyId", company.companyId);
                    });
            });
    });

    // TODO: create user roles/permissions for Authorization and test API calls

    it("additional identity attributes - should set null if no identity", async () => {
        const user = new User();
        await user.save();

        assert.equal(await user.createdBy, null);
        assert.equal(await user.savedBy, null);
        assert.equal(await user.updatedBy, null);

        await user.save();
        assert.equal(await user.createdBy, null);
        assert.equal(await user.savedBy, null);
        assert.equal(await user.updatedBy, null);

        user.id = "someId";
        await user.delete();
        assert.equal(await user.createdBy, null);
        assert.equal(await user.savedBy, null);
        assert.equal(await user.updatedBy, null);
    });

    it("additional identity attributes - should set identity to attributes correctly", async () => {
        const identity = new MyUser().populate({ id: "identityID", username: "identity" });
        let getRequestStub = sandbox.stub(api, "getRequest").callsFake(() => {
            return {
                identity
            };
        });

        const user = new User();
        user.populate({ username: "user" });

        await user.save();

        assert.equal(await user.createdBy, identity);
        assert.equal(await user.savedBy, identity);
        assert.equal(await user.updatedBy, null);

        await user.save();

        assert.equal(await user.createdBy, identity);
        assert.equal(await user.savedBy, identity);
        assert.equal(await user.updatedBy, identity);

        user.id = "someId";
        await user.delete();
        assert.equal(await user.createdBy, identity);
        assert.equal(await user.savedBy, identity);
        assert.equal(await user.updatedBy, identity);

        getRequestStub.restore();
        getRequestStub = sandbox.stub(api, "getRequest").callsFake(() => {
            return { identity: null };
        });

        await user.save();

        assert.equal(await user.createdBy, identity);
        assert.equal(await user.savedBy, null);
        assert.equal(await user.updatedBy, null);

        getRequestStub.restore();
    });
});
