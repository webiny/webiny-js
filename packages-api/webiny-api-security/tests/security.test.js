// @flow
import request from "supertest";
import express from "express";
import { expect } from "chai";
import { MemoryDriver } from "webiny-entity-memory";
import { middleware, endpointMiddleware, Entity } from "webiny-api";

import authenticationMiddleware from "../src/middleware/authentication";
import authorizationMiddleware from "../src/middleware/authorization";
import credentialsStrategy from "./../src/strategies/credentialsStrategy";
import SecurityApp from "../src/app";
import JwtToken from "../src/tokens/jwtToken";
import MyUser from "./entities/myUser";
import MyCompany from "./entities/myCompany";

describe("Security test", () => {
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
                    endpointMiddleware({
                        beforeApiMethod: [
                            //authorizationMiddleware()
                        ]
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

    it("Should return error response", () => {
        return request(app)
            .get("/security/auth/me")
            .expect(401)
            .then(({ body }) => {
                expect(body).to.have.property("code", "WBY_NOT_AUTHENTICATED");
            });
    });

    it("Should authenticate user identity", () => {
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

    it("Should authenticate user identity using token", () => {
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

    it("Should authenticate company identity", () => {
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

    it("Should authenticate company identity using token", () => {
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
});
