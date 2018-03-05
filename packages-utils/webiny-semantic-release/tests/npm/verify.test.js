import { stub } from "sinon";
import proxyquire from "proxyquire";
import clearModule from "clear-module";
import compose from "webiny-compose";
import "./../utils/chai";

describe("[npm verify] plugin test", function() {
    let logger;

    beforeEach(async () => {
        clearModule("../../src/plugins/npm/verify");

        logger = {
            log: stub(),
            error: stub()
        };
    });

    it("should skip verification if release is in `preview` mode", async () => {
        const { default: npmVerifyFactory } = await import("../../src/plugins/npm/verify");

        const release = compose([npmVerifyFactory()]);

        const params = {
            logger,
            config: {
                preview: true
            }
        };

        return release(params).should.be.fulfilled;
    });

    it("should verify access to repository if valid token is set", async () => {
        proxyquire("../../src/plugins/npm/verify", {
            execa: () => {}
        });

        const { default: npmVerifyFactory } = await import("../../src/plugins/npm/verify");
        const release = compose([npmVerifyFactory()]);

        const params = {
            logger,
            config: {}
        };

        return release(params).should.be.fulfilled;
    });

    it("should throw error if invalid token is set", async () => {
        proxyquire("../../src/plugins/npm/verify", {
            execa: () => {
                throw new Error(
                    "ENEEDAUTH: You need to authorize this machine using `npm adduser`"
                );
            }
        });

        const { default: npmVerifyFactory } = await import("../../src/plugins/npm/verify");

        const release = compose([npmVerifyFactory()]);

        const params = {
            logger,
            config: {}
        };

        return release(params).should.be.rejectedWith(Error, /ENEEDAUTH/);
    });
});
