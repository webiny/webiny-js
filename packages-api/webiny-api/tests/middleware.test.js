import request from "supertest";
import express from "express";
import { middleware, EndpointMiddleware } from "webiny-api/src";
import MiddlewareTestApp from "./apps/middleware/default/app";

describe("Endpoint test", () => {
    let app = null;

    before(() => {
        app = express();
        app.use(express.json());
        app.use(
            middleware({
                apps: [new MiddlewareTestApp()],
                middlewares: {
                    request() {
                        return [EndpointMiddleware];
                    }
                }
            })
        );
    });

    it("GET /", () => {
        return request(app)
            .get("/middleware/cars")
            .expect({ data: [{ id: 1 }, { id: 2 }] });
    });

    it("GET /:id (1)", () => {
        return request(app)
            .get("/middleware/cars/1")
            .expect({ data: { id: 1 } });
    });

    it("GET /:id (2)", () => {
        return request(app)
            .get("/middleware/cars/2")
            .expect({ data: { id: 2 } });
    });

    it("GET /:id/races/:year", () => {
        return request(app)
            .get("/middleware/cars/3/races/2017")
            .expect({ data: { id: 3, year: 2017 } });
    });

    it("POST / and execute both extended and parent methods", () => {
        return request(app)
            .post("/middleware/cars")
            .send({ brand: "Tesla", year: 2017 })
            .expect({ data: { brand: "Tesla", year: 2017, extended1: true, extended2: true } });
    });

    it("PATCH /:id", () => {
        return request(app)
            .patch("/middleware/cars/1")
            .send({ brand: "XYZ" })
            .expect({ data: { brand: "XYZ", id: 1 } });
    });

    it("DELETE /:id", () => {
        return request(app)
            .delete("/middleware/cars/1")
            .expect({ data: true });
    });

    it("Wildcard parameter", () => {
        return request(app)
            .get("/middleware/cars/article/some/random/url")
            .expect({ url: "some/random/url" });
    });

    it("Should not match any method", () => {
        return Promise.all([
            request(app)
                .get("/middleware/users")
                .expect(404),
            request(app)
                .get("/middleware/cars/2/wrong-method")
                .expect(404),
            request(app)
                .post("/middleware/cars/1")
                .expect(404)
        ]);
    });
});
