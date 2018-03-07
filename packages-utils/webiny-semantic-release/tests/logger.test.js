import { assert } from "chai";
import loggerFactory from "./../src/utils/logger";
import sinon from "sinon";

describe("logger test", () => {
    let logger;
    let spyLog;
    let spyError;

    beforeEach(() => {
        logger = loggerFactory();
        spyLog = sinon.spy(logger, "log");
        spyError = sinon.spy(logger, "error");
        sinon.stub(console, "log");
        sinon.stub(console, "error");
    });

    const restore = () => {
        console.log.restore();
        console.error.restore();
        spyLog.restore();
        spyError.restore();
    };

    it("should log message", () => {
        logger.log("message %s", 12);
        try {
            assert(logger.log.calledOnce);
            assert.equal("message %s", logger.log.getCall(0).args[0]);
            assert.equal(12, logger.log.getCall(0).args[1]);
        } finally {
            restore();
        }
    });

    it("should log error", () => {
        logger.error("message %s", 12);
        try {
            assert(logger.error.calledOnce);
            assert.equal("message %s", logger.error.getCall(0).args[0]);
            assert.equal(12, logger.error.getCall(0).args[1]);
        } finally {
            restore();
        }
    });
});
