import { describe, it, expect, beforeEach, vi } from "vitest";
import { Container } from "@webiny/di";
import { LoggerServiceFeature } from "../feature.js";
import { LoggerService as LoggerServiceAbstraction } from "../abstractions.js";
import { pino, type Logger } from "@webiny/logger";

describe("LoggerService", () => {
    let container: Container;
    let loggerService: LoggerServiceAbstraction.Interface;

    beforeEach(() => {
        container = new Container();
        LoggerServiceFeature.register(container);
        loggerService = container.resolve(LoggerServiceAbstraction);
    });

    describe("Feature Registration", () => {
        it("should register LoggerService in the container", () => {
            expect(loggerService).toBeDefined();
            expect(loggerService.getLogger()).toBeDefined();
        });

        it("should return a valid logger instance", () => {
            const logger = loggerService.getLogger();
            expect(logger).toBeDefined();
            expect(typeof logger.info).toBe("function");
            expect(typeof logger.error).toBe("function");
            expect(typeof logger.warn).toBe("function");
            expect(typeof logger.debug).toBe("function");
            expect(typeof logger.trace).toBe("function");
            expect(typeof logger.fatal).toBe("function");
        });
    });

    describe("Custom Logger Configuration", () => {
        it("should allow custom logger instance during registration", () => {
            const customContainer = new Container();
            const customLogger = pino({ level: "debug" });
            
            LoggerServiceFeature.register(customContainer, customLogger);
            const customLoggerService = customContainer.resolve(LoggerServiceAbstraction);
            
            expect(customLoggerService.getLogger()).toBe(customLogger);
        });
    });

    describe("Logging Methods", () => {
        let mockLogger: Logger;

        beforeEach(() => {
            mockLogger = pino({ level: "silent" }); // Silent to avoid console output in tests
            const containerWithMock = new Container();
            LoggerServiceFeature.register(containerWithMock, mockLogger);
            loggerService = containerWithMock.resolve(LoggerServiceAbstraction);
        });

        it("should call fatal with string message", () => {
            const spy = vi.spyOn(mockLogger, "fatal");
            loggerService.fatal("Fatal error occurred");
            expect(spy).toHaveBeenCalledWith("Fatal error occurred");
        });

        it("should call fatal with object and message", () => {
            const spy = vi.spyOn(mockLogger, "fatal");
            const errorObj = { code: 500, message: "Server error" };
            loggerService.fatal(errorObj, "Fatal error occurred");
            expect(spy).toHaveBeenCalledWith(errorObj, "Fatal error occurred");
        });

        it("should call error with string message", () => {
            const spy = vi.spyOn(mockLogger, "error");
            loggerService.error("Error occurred");
            expect(spy).toHaveBeenCalledWith("Error occurred");
        });

        it("should call error with object and message", () => {
            const spy = vi.spyOn(mockLogger, "error");
            const errorObj = { code: 400, message: "Bad request" };
            loggerService.error(errorObj, "Error occurred");
            expect(spy).toHaveBeenCalledWith(errorObj, "Error occurred");
        });

        it("should call warn with string message", () => {
            const spy = vi.spyOn(mockLogger, "warn");
            loggerService.warn("Warning message");
            expect(spy).toHaveBeenCalledWith("Warning message");
        });

        it("should call warn with object and message", () => {
            const spy = vi.spyOn(mockLogger, "warn");
            const warnObj = { deprecation: true };
            loggerService.warn(warnObj, "Warning message");
            expect(spy).toHaveBeenCalledWith(warnObj, "Warning message");
        });

        it("should call info with string message", () => {
            const spy = vi.spyOn(mockLogger, "info");
            loggerService.info("Info message");
            expect(spy).toHaveBeenCalledWith("Info message");
        });

        it("should call info with object and message", () => {
            const spy = vi.spyOn(mockLogger, "info");
            const infoObj = { userId: "123" };
            loggerService.info(infoObj, "Info message");
            expect(spy).toHaveBeenCalledWith(infoObj, "Info message");
        });

        it("should call debug with string message", () => {
            const spy = vi.spyOn(mockLogger, "debug");
            loggerService.debug("Debug message");
            expect(spy).toHaveBeenCalledWith("Debug message");
        });

        it("should call debug with object and message", () => {
            const spy = vi.spyOn(mockLogger, "debug");
            const debugObj = { requestId: "abc-123" };
            loggerService.debug(debugObj, "Debug message");
            expect(spy).toHaveBeenCalledWith(debugObj, "Debug message");
        });

        it("should call trace with string message", () => {
            const spy = vi.spyOn(mockLogger, "trace");
            loggerService.trace("Trace message");
            expect(spy).toHaveBeenCalledWith("Trace message");
        });

        it("should call trace with object and message", () => {
            const spy = vi.spyOn(mockLogger, "trace");
            const traceObj = { step: 1 };
            loggerService.trace(traceObj, "Trace message");
            expect(spy).toHaveBeenCalledWith(traceObj, "Trace message");
        });
    });

    describe("Child Logger", () => {
        it("should create child logger with bindings", () => {
            const childLogger = loggerService.child({ requestId: "test-123" });
            
            expect(childLogger).toBeDefined();
            expect(typeof childLogger.info).toBe("function");
        });

        it("should create multiple child loggers with different bindings", () => {
            const child1 = loggerService.child({ module: "auth" });
            const child2 = loggerService.child({ module: "database" });
            
            expect(child1).toBeDefined();
            expect(child2).toBeDefined();
            expect(child1).not.toBe(child2);
        });
    });

    describe("Integration", () => {
        it("should work with container resolution", () => {
            const resolvedService = container.resolve(LoggerServiceAbstraction);
            expect(resolvedService).toBe(loggerService);
        });

        it("should be usable by other services via DI", () => {
            // Simulating another service that depends on LoggerService
            class ExampleService {
                constructor(private logger: LoggerServiceAbstraction.Interface) {}

                doSomething() {
                    this.logger.info("Doing something");
                    return "done";
                }
            }

            // Register example service
            container.registerSingleton(ExampleService, (c) => {
                return new ExampleService(c.resolve(LoggerServiceAbstraction));
            });

            const exampleService = container.resolve(ExampleService);
            const result = exampleService.doSomething();
            
            expect(result).toBe("done");
        });
    });

    describe("Multiple Log Calls", () => {
        let mockLogger: Logger;

        beforeEach(() => {
            mockLogger = pino({ level: "silent" });
            const containerWithMock = new Container();
            LoggerServiceFeature.register(containerWithMock, mockLogger);
            loggerService = containerWithMock.resolve(LoggerServiceAbstraction);
        });

        it("should handle multiple sequential log calls", () => {
            const infoSpy = vi.spyOn(mockLogger, "info");
            const errorSpy = vi.spyOn(mockLogger, "error");
            const warnSpy = vi.spyOn(mockLogger, "warn");

            loggerService.info("First message");
            loggerService.error("Error message");
            loggerService.warn("Warning message");
            loggerService.info("Second message");

            expect(infoSpy).toHaveBeenCalledTimes(2);
            expect(errorSpy).toHaveBeenCalledTimes(1);
            expect(warnSpy).toHaveBeenCalledTimes(1);
        });

        it("should handle mixed object and string calls", () => {
            const spy = vi.spyOn(mockLogger, "info");

            loggerService.info("Plain string");
            loggerService.info({ data: "value" }, "With object");
            loggerService.info("Another string");

            expect(spy).toHaveBeenCalledTimes(3);
        });
    });
});
