// @flow
import request from "supertest";
import express from "express";
import { expect } from "chai";
import { middleware, endpointMiddleware } from "webiny-api/src";

import authenticationMiddleware from "../src/middleware/authentication";
import credentialsStrategy from "./../src/strategies/credentialsStrategy";
import SecurityApp from "../src/app";
import JwtToken from "../src/tokens/jwtToken";
import MyUser from "./entities/myUser";

describe("Security test", () => {
    let app = null;

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
                                credentials: credentialsStrategy({
                                    credentials: req => {
                                        return {
                                            username: req.body.username,
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
                                }
                            ]
                        }
                    })
                ],
                use: [
                    authenticationMiddleware({ token: req => req.get("Api-Token") }),
                    endpointMiddleware({
                        beforeApiMethod: [
                            // authorizationMiddleware()
                        ]
                    })
                ]
            })
        );
    });

    it("Should return error response", () => {
        return request(app)
            .get("/security/auth/me")
            .expect(401)
            .then(({ body }) => {
                expect(body).to.have.property("code", "WBY_NOT_AUTHENTICATED");
            });
    });
});
