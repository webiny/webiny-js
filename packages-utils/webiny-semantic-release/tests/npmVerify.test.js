import { stub } from "sinon";
import proxyquire from "proxyquire";
import clearModule from "clear-module";
import compose from "webiny-compose";
import "./utils/chai";

describe("npmVerify plugin test", function () {
    let logger;
    const modulePath = "../src/plugins/npm/verify";

    beforeEach(async () => {
        clearModule(modulePath);

        logger = {
            log: stub(),
            error: stub()
        };
    });

    it("should skip verification if release is in `preview` mode", async () => {
        const { default: npmVerifyFactory } = await import(modulePath);

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
        proxyquire(modulePath, {
            execa: () => {
            }
        });

        const { default: npmVerifyFactory } = await import(modulePath);
        const release = compose([npmVerifyFactory()]);

        const params = {
            logger,
            config: {}
        };

        return release(params).should.be.fulfilled;
    });

    it("should throw error if invalid token is set", async () => {
        proxyquire(modulePath, {
            execa: () => {
                throw new Error(
                    "ENEEDAUTH: You need to authorize this machine using `npm adduser`"
                );
            }
        });

        const { default: npmVerifyFactory } = await import(modulePath);

        const release = compose([npmVerifyFactory()]);

        const params = {
            logger,
            config: {}
        };

        return release(params).should.be.rejectedWith(Error, /ENEEDAUTH/);
    });
});
