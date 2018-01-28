import request from "supertest";
import express from "express";
import { middleware, versionFromUrl } from "webiny-api/src";
import MiddlewareTestApp from "./apps/middleware/versioned/app";

describe("Versioning from URL", () => {
    let app = null;

    before(() => {
        app = express();
        app.use(express.json());
        app.use(
            middleware({
                versioning: versionFromUrl(),
                apps: [new MiddlewareTestApp()]
            })
        );
    });

    it("GET /v1: Trigger the highest possible version in the 1.x range", () => {
        return request(app)
            .get("/v1/middleware/cars")
            .expect({ data: [{ id: 5 }] });
    });

    it("GET /v1.0: Trigger the highest possible version in the 1.0.x range", () => {
        return request(app)
            .get("/v1.0/middleware/cars")
            .expect({ data: [{ id: 1 }, { id: 2 }] });
    });

    it("GET /v1.5: Trigger the highest possible version in the v1.5.x range", () => {
        return request(app)
            .get("/v1.5/middleware/cars")
            .expect({ data: [{ id: 5 }] });
    });

    it("GET /v2: Trigger the highest possible version in the v2.x range", () => {
        return request(app)
            .get("/v2/middleware/cars")
            .expect({ data: [{ id: 3 }, { id: 4 }] });
    });

    it("GET /: Trigger latest version by default", () => {
        return request(app)
            .get("/middleware/cars")
            .expect({ data: [{ id: 3 }, { id: 4 }] });
    });
});
