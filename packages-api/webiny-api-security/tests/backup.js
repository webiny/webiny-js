import { expect } from "chai";
import request from "supertest";
import express from "express";
import { MemoryDriver } from "webiny-entity-memory";
import { middleware } from "./../src";
import AuthenticationTestApp from "./apps/authentication/app";
import User from "./apps/authentication/entities/user";

describe("Authentication test", () => {
    let token = null;
    let app = null;

    before(() => {
        app = express();
        app.use(express.json());
        app.use(
            middleware({
                apps: [new AuthenticationTestApp()],
                auth: {
                    entity: User,
                    jwtSecret: "MyS3cr3tK3Y",
                    tokenExpiresIn: "30d"
                },
                entity: {
                    driver: new MemoryDriver()
                }
            })
        );
    });

    it("Should return WBY_NOT_AUTHENTICATED", () => {
        return request(app)
            .get("/authentication/users/me")
            .expect(401)
            .expect({ message: "Invalid user", code: "WBY_NOT_AUTHENTICATED" });
    });

    it("Should create user", () => {
        return request(app)
            .post("/authentication/users")
            .send({ email: "pavel@webiny.com", password: "dev" })
            .expect(200)
            .then(({ body }) => {
                expect(body).to.have.nested.property("data.email", "pavel@webiny.com");
                expect(body).to.have.nested.property("data.id");
            });
    });

    it("Should allow login", async () => {
        return request(app)
            .post("/authentication/users/login")
            .send({ email: "pavel@webiny.com", password: "dev" })
            .expect(200)
            .then(({ body }) => {
                expect(body).to.have.nested.property("data.token");
                expect(body).to.have.nested.property("data.user.email", "pavel@webiny.com");
                token = body.data.token;
            });
    });

    it("Should return a list of users", () => {
        return request(app)
            .get("/authentication/users")
            .set({
                "Webiny-Authorization": token
            })
            .expect(200)
            .then(({ body }) => {
                expect(body).to.have.nested.property("data[0].email");
            });
    });
});
