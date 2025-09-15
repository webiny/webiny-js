import { describe, test, expect, beforeEach, vi } from "vitest";
import {
    Container,
    Abstraction,
    createImplementation,
    createDecorator,
    isDecorator,
    createComposite,
    isComposite
} from "~/index.js";
// Mock implementations for testing
interface ILogger {
    log(...args: unknown[]): void;
}

interface IFormatter {
    format(message: string): string;
}

class ConsoleLogger implements ILogger {
    log(...args: unknown[]): void {
        console.log("ConsoleLogger:", ...args);
    }
}

class FileLogger implements ILogger {
    log(...args: unknown[]): void {
        console.log("FileLogger:", ...args);
    }
}

class CompositeLogger implements ILogger {
    constructor(private readonly loggers: ILogger[]) {}

    log(...args: unknown[]): void {
        for (const logger of this.loggers) {
            logger.log(...args);
        }
    }
}

class UpperCaseFormatter implements IFormatter {
    format(message: string): string {
        return message.toUpperCase();
    }
}

describe("DIContainer", () => {
    let rootContainer: Container;
    const LoggerAbstraction = new Abstraction<ILogger>("Logger");
    const FormatterAbstraction = new Abstraction<IFormatter>("Formatter");

    beforeEach(() => {
        rootContainer = new Container();
    });

    test("should register and resolve an implementation as Transient (default)", () => {
        const consoleLoggerImpl = createImplementation({
            abstraction: LoggerAbstraction,
            implementation: ConsoleLogger,
            dependencies: []
        });

        rootContainer.register(consoleLoggerImpl);

        const logger1 = rootContainer.resolve(LoggerAbstraction);
        const logger2 = rootContainer.resolve(LoggerAbstraction);

        expect(logger1).not.toBe(logger2); // Different instances each time
    });

    test("should register and resolve an implementation as Singleton", () => {
        const consoleLoggerImpl = createImplementation({
            abstraction: LoggerAbstraction,
            implementation: ConsoleLogger,
            dependencies: []
        });
        rootContainer.register(consoleLoggerImpl).inSingletonScope();

        const logger1 = rootContainer.resolve(LoggerAbstraction);
        const logger2 = rootContainer.resolve(LoggerAbstraction);

        expect(logger1).toBe(logger2); // Same instance each time
    });

    test("should resolve instance from parent container if not found in child container", () => {
        const consoleLoggerImpl = createImplementation({
            abstraction: LoggerAbstraction,
            implementation: ConsoleLogger,
            dependencies: []
        });
        rootContainer.register(consoleLoggerImpl).inSingletonScope();

        const childContainer = rootContainer.createChildContainer();
        const loggerFromChild = childContainer.resolve(LoggerAbstraction);

        const loggerFromRoot = rootContainer.resolve(LoggerAbstraction);
        expect(loggerFromChild).toBe(loggerFromRoot); // Resolved from parent container
    });

    test("should resolve multiple transient implementations of the same abstraction when multiple flag is used", () => {
        const consoleLoggerImpl = createImplementation({
            abstraction: LoggerAbstraction,
            implementation: ConsoleLogger,
            dependencies: []
        });
        const fileLoggerImpl = createImplementation({
            abstraction: LoggerAbstraction,
            implementation: FileLogger,
            dependencies: []
        });

        rootContainer.register(consoleLoggerImpl);
        rootContainer.register(fileLoggerImpl);

        class LoggerManager {
            constructor(public loggers: ILogger[]) {}
        }

        const managerAbstraction = new Abstraction<LoggerManager>("LoggerManager");

        const managerImpl = createImplementation({
            abstraction: managerAbstraction,
            implementation: LoggerManager,
            dependencies: [[LoggerAbstraction, { multiple: true }]]
        });

        rootContainer.register(managerImpl);

        const manager = rootContainer.resolve(managerAbstraction);
        expect(manager.loggers.length).toBe(2);
        expect(manager.loggers.some(logger => logger instanceof ConsoleLogger)).toBe(true);
        expect(manager.loggers.some(logger => logger instanceof FileLogger)).toBe(true);
    });

    test("should resolve a composite wrapper when a single implementation is requested", () => {
        let numberOfLogCalls = 0;

        // For assertion purposes, we create a logger decorator.
        class LoggerDecorator implements ILogger {
            constructor(private decoratee: ILogger) {}

            log(): void {
                numberOfLogCalls++;
            }
        }

        const loggerDecorator = createDecorator({
            abstraction: LoggerAbstraction,
            decorator: LoggerDecorator,
            dependencies: []
        });

        const consoleLoggerImpl = createImplementation({
            abstraction: LoggerAbstraction,
            implementation: ConsoleLogger,
            dependencies: []
        });
        const fileLoggerImpl = createImplementation({
            abstraction: LoggerAbstraction,
            implementation: FileLogger,
            dependencies: []
        });

        const compositeImpl = createComposite({
            abstraction: LoggerAbstraction,
            implementation: CompositeLogger,
            dependencies: [[LoggerAbstraction, { multiple: true }]]
        });

        rootContainer.register(consoleLoggerImpl);
        rootContainer.register(fileLoggerImpl);
        rootContainer.registerDecorator(loggerDecorator);
        rootContainer.registerComposite(compositeImpl);

        class InjectionTest {
            constructor(public logger: ILogger) {}

            getLogger() {
                return this.logger;
            }
        }

        const testObject = rootContainer.resolveWithDependencies({
            implementation: InjectionTest,
            dependencies: [LoggerAbstraction]
        });

        const compositeLogger = testObject.getLogger();
        expect(compositeLogger instanceof CompositeLogger).toBe(true);

        compositeLogger.log("Composite log!");
        expect(numberOfLogCalls).toBe(2);
    });

    test("should resolve multiple singleton implementations of the same abstraction when multiple flag is used", () => {
        const consoleLoggerImpl = createImplementation({
            abstraction: LoggerAbstraction,
            implementation: ConsoleLogger,
            dependencies: []
        });
        const fileLoggerImpl = createImplementation({
            abstraction: LoggerAbstraction,
            implementation: FileLogger,
            dependencies: []
        });

        rootContainer.register(consoleLoggerImpl).inSingletonScope();
        rootContainer.register(fileLoggerImpl).inSingletonScope();

        class LoggerManager {
            constructor(public loggers: ILogger[]) {}
        }

        const managerAbstraction = new Abstraction<LoggerManager>("LoggerManager");

        const managerImpl = createImplementation({
            abstraction: managerAbstraction,
            implementation: LoggerManager,
            dependencies: [[LoggerAbstraction, { multiple: true }]]
        });

        rootContainer.register(managerImpl);

        const manager = rootContainer.resolve(managerAbstraction);
        expect(manager.loggers.length).toBe(2);
        expect(manager.loggers.some(logger => logger instanceof ConsoleLogger)).toBe(true);
        expect(manager.loggers.some(logger => logger instanceof FileLogger)).toBe(true);
    });

    test("should apply decorators to implementation", () => {
        class LoggerDecorator implements ILogger {
            constructor(private decoratee: ILogger) {}

            log(...args: unknown[]): void {
                console.log("Decorated:");
                this.decoratee.log(...args);
            }
        }

        const consoleLoggerImpl = createImplementation({
            abstraction: LoggerAbstraction,
            implementation: ConsoleLogger,
            dependencies: []
        });
        rootContainer.register(consoleLoggerImpl);

        const loggerDecorator = createDecorator({
            abstraction: LoggerAbstraction,
            decorator: LoggerDecorator,
            dependencies: []
        });

        rootContainer.registerDecorator(loggerDecorator);

        const logger = rootContainer.resolve(LoggerAbstraction);
        expect(logger).toBeInstanceOf(LoggerDecorator);
    });

    test("should register and resolve a pre-instantiated object as Singleton", () => {
        const preInstantiatedLogger = new FileLogger();

        rootContainer.registerInstance(LoggerAbstraction, preInstantiatedLogger);

        const resolvedLogger1 = rootContainer.resolve(LoggerAbstraction);
        const resolvedLogger2 = rootContainer.resolve(LoggerAbstraction);

        expect(resolvedLogger1).toBe(preInstantiatedLogger);
        expect(resolvedLogger1).toBe(resolvedLogger2); // Singleton behavior
    });

    test("should apply decorators to pre-instantiated object", () => {
        class LoggerDecorator implements ILogger {
            constructor(private decoratee: ILogger) {}

            log(...args: unknown[]): void {
                console.log("Decorated:");
                this.decoratee.log(...args);
            }
        }

        const preInstantiatedLogger = new ConsoleLogger();
        rootContainer.registerInstance(LoggerAbstraction, preInstantiatedLogger);

        const loggerDecorator = createDecorator({
            abstraction: LoggerAbstraction,
            decorator: LoggerDecorator,
            dependencies: []
        });

        rootContainer.registerDecorator(loggerDecorator);

        const decoratedLogger = rootContainer.resolve(LoggerAbstraction);
        expect(decoratedLogger).toBeInstanceOf(LoggerDecorator);

        // Verify that the decorator actually calls the original implementation
        const consoleSpy = vi.spyOn(console, "log");
        decoratedLogger.log("Testing decorator on instance");
        expect(consoleSpy).toHaveBeenCalledWith("Decorated:");
        expect(consoleSpy).toHaveBeenCalledWith("ConsoleLogger:", "Testing decorator on instance");
        consoleSpy.mockRestore();
    });

    test("should resolve multiple instances when both class-based and pre-instantiated registrations exist", () => {
        const consoleLoggerImpl = createImplementation({
            abstraction: LoggerAbstraction,
            implementation: ConsoleLogger,
            dependencies: []
        });
        rootContainer.register(consoleLoggerImpl);

        const fileLoggerInstance = new FileLogger();
        rootContainer.registerInstance(LoggerAbstraction, fileLoggerInstance);

        class LoggerManager {
            constructor(public loggers: ILogger[]) {}
        }

        const managerAbstraction = new Abstraction<LoggerManager>("LoggerManager");

        const managerImpl = createImplementation({
            abstraction: managerAbstraction,
            implementation: LoggerManager,
            dependencies: [[LoggerAbstraction, { multiple: true }]]
        });

        rootContainer.register(managerImpl);

        const manager = rootContainer.resolve(managerAbstraction);
        expect(manager.loggers.length).toBe(2);
        expect(manager.loggers.some(logger => logger instanceof ConsoleLogger)).toBe(true);
        expect(manager.loggers.some(logger => logger === fileLoggerInstance)).toBe(true);
    });

    test("should resolve dependencies and instantiate any given class", () => {
        const consoleLoggerImpl = createImplementation({
            abstraction: LoggerAbstraction,
            implementation: ConsoleLogger,
            dependencies: []
        });
        const fileLoggerImpl = createImplementation({
            abstraction: LoggerAbstraction,
            implementation: FileLogger,
            dependencies: []
        });

        rootContainer.register(consoleLoggerImpl);
        rootContainer.register(fileLoggerImpl);

        class LoggerManager {
            constructor(public loggers: ILogger[]) {}
        }

        const manager = rootContainer.resolveWithDependencies({
            implementation: LoggerManager,
            dependencies: [[LoggerAbstraction, { multiple: true }]]
        });

        expect(manager.loggers.length).toBe(2);
        expect(manager.loggers.some(logger => logger instanceof ConsoleLogger)).toBe(true);
        expect(manager.loggers.some(logger => logger instanceof FileLogger)).toBe(true);
    });

    test("should apply decorators with dependencies", () => {
        // Register formatter implementation
        const formatterImpl = createImplementation({
            abstraction: FormatterAbstraction,
            implementation: UpperCaseFormatter,
            dependencies: []
        });
        rootContainer.register(formatterImpl);

        // Register logger implementation
        const consoleLoggerImpl = createImplementation({
            abstraction: LoggerAbstraction,
            implementation: ConsoleLogger,
            dependencies: []
        });
        rootContainer.register(consoleLoggerImpl);

        // Create a decorator that uses both a formatter and the decoratee
        class FormattingLoggerDecorator implements ILogger {
            constructor(private formatter: IFormatter, private decoratee: ILogger) {}

            log(...args: unknown[]): void {
                const formattedArgs = args.map(arg =>
                    typeof arg === "string" ? this.formatter.format(arg) : arg
                );
                this.decoratee.log(...formattedArgs);
            }
        }

        const formattingLoggerDecorator = createDecorator({
            abstraction: LoggerAbstraction,
            decorator: FormattingLoggerDecorator,
            dependencies: [FormatterAbstraction]
        });

        rootContainer.registerDecorator(formattingLoggerDecorator);

        const logger = rootContainer.resolve(LoggerAbstraction);
        expect(logger).toBeInstanceOf(FormattingLoggerDecorator);

        // Verify that the decorator uses both the formatter and the decoratee
        const consoleSpy = vi.spyOn(console, "log");
        logger.log("hello world");
        expect(consoleSpy).toHaveBeenCalledWith("ConsoleLogger:", "HELLO WORLD");
        consoleSpy.mockRestore();
    });

    test("should correctly assert decorators", () => {
        class LoggerDecorator implements ILogger {
            constructor(private decoratee: ILogger) {}

            log(): void {}
        }

        const loggerDecorator = createDecorator({
            abstraction: LoggerAbstraction,
            decorator: LoggerDecorator,
            dependencies: []
        });

        expect(isDecorator(loggerDecorator)).toBe(true);

        const consoleLoggerImpl = createImplementation({
            abstraction: LoggerAbstraction,
            implementation: ConsoleLogger,
            dependencies: []
        });

        expect(isDecorator(consoleLoggerImpl)).toBe(false);
    });

    test("should correctly assert composites", () => {
        const consoleLoggerImpl = createComposite({
            abstraction: LoggerAbstraction,
            implementation: ConsoleLogger,
            dependencies: []
        });

        expect(isComposite(consoleLoggerImpl)).toBe(true);

        const formatterImpl = createImplementation({
            abstraction: FormatterAbstraction,
            implementation: UpperCaseFormatter,
            dependencies: []
        });

        expect(isComposite(formatterImpl)).toBe(false);
    });

    test("registerDecorator should throw on a non-decorator", () => {
        const nonDecorator = createImplementation({
            abstraction: FormatterAbstraction,
            implementation: UpperCaseFormatter,
            dependencies: []
        });

        expect(() => rootContainer.registerDecorator(nonDecorator)).toThrow(/is not a decorator/);
    });

    test("registerComposite should throw on a non-composite", () => {
        const nonComposite = createImplementation({
            abstraction: FormatterAbstraction,
            implementation: UpperCaseFormatter,
            dependencies: []
        });

        expect(() => rootContainer.registerComposite(nonComposite)).toThrow(/is not a composite/);
    });

    test("register should throw on a composite", () => {
        const composite = createComposite({
            abstraction: LoggerAbstraction,
            implementation: ConsoleLogger,
            dependencies: []
        });

        expect(() => rootContainer.register(composite)).toThrow(/is a composite/);
    });

    test("register should throw on a decorator", () => {
        class LoggerDecorator implements ILogger {
            constructor(private decoratee: ILogger) {}

            log(): void {}
        }

        const loggerDecorator = createDecorator({
            abstraction: LoggerAbstraction,
            decorator: LoggerDecorator,
            dependencies: []
        });

        expect(() => rootContainer.register(loggerDecorator)).toThrow(/is a decorator/);
    });

    test("types should support various formats of a single required dependency", () => {
        class RequiredLogger implements ILogger {
            constructor(public logger: ILogger) {}

            log(): void {}
        }

        createImplementation({
            abstraction: LoggerAbstraction,
            implementation: RequiredLogger,
            dependencies: [LoggerAbstraction]
        });

        createImplementation({
            abstraction: LoggerAbstraction,
            implementation: RequiredLogger,
            dependencies: [[LoggerAbstraction]]
        });

        createImplementation({
            abstraction: LoggerAbstraction,
            implementation: RequiredLogger,
            dependencies: [[LoggerAbstraction, { multiple: false }]]
        });

        createImplementation({
            abstraction: LoggerAbstraction,
            implementation: RequiredLogger,
            dependencies: [[LoggerAbstraction, { multiple: false, optional: false }]]
        });
    });

    test("types should support various formats of an optional dependency", () => {
        class OptionalLogger implements ILogger {
            constructor(public logger?: ILogger) {}

            log(): void {}
        }

        createImplementation({
            abstraction: LoggerAbstraction,
            implementation: OptionalLogger,
            dependencies: [[LoggerAbstraction, { optional: true }]]
        });

        createImplementation({
            abstraction: LoggerAbstraction,
            implementation: OptionalLogger,
            dependencies: [[LoggerAbstraction, { multiple: false, optional: true }]]
        });
    });

    test("types should support various formats of required list of dependencies", () => {
        class RequiredLogger implements ILogger {
            constructor(public logger: ILogger[]) {}

            log(): void {}
        }

        createImplementation({
            abstraction: LoggerAbstraction,
            implementation: RequiredLogger,
            dependencies: [[LoggerAbstraction, { multiple: true }]]
        });

        createImplementation({
            abstraction: LoggerAbstraction,
            implementation: RequiredLogger,
            dependencies: [[LoggerAbstraction, { multiple: true, optional: false }]]
        });
    });

    test("types should support optional list of dependencies", () => {
        class RequiredLogger implements ILogger {
            constructor(public logger?: ILogger[]) {}

            log(): void {}
        }

        createImplementation({
            abstraction: LoggerAbstraction,
            implementation: RequiredLogger,
            dependencies: [[LoggerAbstraction, { multiple: true, optional: true }]]
        });
    });
});
