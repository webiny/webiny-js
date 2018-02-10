import { expect } from "chai";
import request from "supertest";
import express from "express";
import { MemoryDriver } from "webiny-entity-memory";
import { middleware, endpointMiddleware } from "./../src";
import CrudApp from "./apps/crud/app";

describe("Entity endpoint test", () => {
    let app = null;
    let entityId = null;

    before(() => {
        app = express();
        app.use(express.json());
        app.use(
            middleware({
                apps: [new CrudApp()],
                entity: {
                    driver: new MemoryDriver()
                },
                use: [endpointMiddleware()]
            })
        );
    });

    it("should return a list response", () => {
        return request(app)
            .get("/crud/users")
            .expect(200)
            .then(({ body }) => {
                expect(body.data).to.include.all.keys("list", "meta");
            });
    });

    it("should return validation error response", () => {
        return request(app)
            .post("/crud/users")
            .send({ email: 123 })
            .expect(404)
            .then(({ body }) => {
                expect(body.data).to.have.nested.property("invalidAttributes.email");
                expect(body.code).to.equal("WBY_ENTITY_DATA_VALIDATION");
            });
    });

    it("should create and return entity data", () => {
        return request(app)
            .post("/crud/users")
            .query({ _fields: "id,email" })
            .send({ email: "email@webiny.com", password: "dev" })
            .expect(200)
            .then(({ body }) => {
                expect(body.data).to.include.all.keys("entity", "meta");
                expect(body.data).to.nested.include({ "entity.email": "email@webiny.com" });
                entityId = body.data.entity.id;
            });
    });

    it("should return entity response", () => {
        return request(app)
            .get("/crud/users/" + entityId)
            .query({ _fields: "id,email" })
            .expect(200)
            .then(({ body }) => {
                expect(body.data).to.include.all.keys("entity", "meta");
                expect(body.data).to.nested.include({ "entity.email": "email@webiny.com" });
            });
    });

    it("should return error response", () => {
        return request(app)
            .get("/crud/users/12345")
            .expect(404)
            .then(({ body }) => {
                expect(body.code).to.equal("WBY_ENTITY_NOT_FOUND");
            });
    });

    it("should update a record", () => {
        return request(app)
            .patch("/crud/users/" + entityId)
            .query({ _fields: "id,email" })
            .send({ email: "new-email@webiny.com" })
            .expect(200)
            .then(({ body }) => {
                expect(body.data).to.include.all.keys("entity", "meta");
                expect(body.data.entity.email).to.equal("new-email@webiny.com");
            });
    });

    it("should delete a record", () => {
        return request(app)
            .delete("/crud/users/" + entityId)
            .expect(200)
            .then(({ body }) => {
                expect(body.data).to.equal(true);
            });
    });
});
