import request from "supertest";
import express from "express";
import { middleware, endpointMiddleware, versionFromHeader } from "webiny-api";
import MiddlewareTestApp from "./apps/middleware/versioned/app";

describe("Versioning from Header", () => {
    let app = null;

    before(() => {
        app = express();
        app.use(express.json());
        app.use(
            middleware({
                versioning: versionFromHeader("Api-Version"),
                apps: [new MiddlewareTestApp()],
                use: [endpointMiddleware()]
            })
        );
    });

    it("Trigger the highest possible version in the 1.x range", () => {
        return request(app)
            .get("/middleware/cars")
            .set({ "Api-Version": "1" })
            .expect({ data: [{ id: 5 }] });
    });

    it("Trigger the highest possible version in the 1.0.x range", () => {
        return request(app)
            .get("/middleware/cars")
            .set({ "Api-Version": "1.0" })
            .expect({ data: [{ id: 1 }, { id: 2 }] });
    });

    it("Trigger the highest possible version in the v1.5.x range", () => {
        return request(app)
            .get("/middleware/cars")
            .set({ "Api-Version": "1.5" })
            .expect({ data: [{ id: 5 }] });
    });

    it("Trigger the highest possible version in the v2.x range", () => {
        return request(app)
            .get("/middleware/cars")
            .set({ "Api-Version": "2" })
            .expect({ data: [{ id: 3 }, { id: 4 }] });
    });

    it("Trigger latest version by default", () => {
        return request(app)
            .get("/middleware/cars")
            .expect({ data: [{ id: 3 }, { id: 4 }] });
    });
});
