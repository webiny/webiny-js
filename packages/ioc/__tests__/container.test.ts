import { createContainer, makeInjectable, inject, AbstractDecorator } from "~/index";

describe("Decorators", () => {
    let container: ReturnType<typeof createContainer>;

    beforeEach(() => {
        container = createContainer();
        container.bind(ISaluteSymbol).to(BaseClass);
    });

    it("should support registration of simple decorators", () => {
        container.registerDecorator(ISaluteSymbol, MySimpleDecorator1);
        container.registerDecorator(ISaluteSymbol, MySimpleDecorator2);

        // Assert
        const salute = container.get<ISalute>(ISaluteSymbol).salute();
        expect(salute).toBe("MySecondSalute<MyFirstSalute<BaseClass>>");
    });

    it("should resolve decorators with their dependencies", () => {
        container.bind(IMessageProviderSymbol).to(MessageProvider);
        container.bind(ISuffixProviderSymbol).to(SuffixProvider);
        container.registerDecorator(ISaluteSymbol, MyComplexDecorator1);
        container.registerDecorator(ISaluteSymbol, MyComplexDecorator2);

        // Assert
        const salute = container.get<ISalute>(ISaluteSymbol).salute();
        expect(salute).toBe("MyComplexSalute<prefix:BaseClass:suffix>");
    });

    it("should allow dynamic bindings by using a factory", () => {
        class Test {
            typesFactory: () => number[];
            constructor(types: () => number[]) {
                this.typesFactory = types;
            }

            get types() {
                return this.typesFactory();
            }
        }

        makeInjectable(Test, [inject("types")]);

        // container.bind(Test).toSelf().inSingletonScope();
        container.bind("types").toFactory(context => {
            return () => {
                return context.container.getAll("type");
            };
        });
        container.bind("type").toConstantValue(1);
        container.bind("type").toConstantValue(2);

        // Assert
        const test = container.get(Test);
        expect(test.types).toStrictEqual([1, 2]);

        // Add more bindings
        container.bind("type").toConstantValue(3);
        container.bind("type").toConstantValue(4);

        // Assert
        expect(test.types).toStrictEqual([1, 2, 3, 4]);

        // Add more bindings
        container.bind("type").toConstantValue(5);
        container.bind("type").toConstantValue(6);

        // Assert
        expect(test.types).toStrictEqual([1, 2, 3, 4, 5, 6]);
    });
});

/**
 * Setup classes and interfaces
 */

interface ISalute {
    salute(): string;
}

const ISaluteSymbol = Symbol.for("ISalute");

class BaseClass implements ISalute {
    salute(): string {
        return "BaseClass";
    }
}

makeInjectable(BaseClass);

/**
 * Simple decorators
 */

class MySimpleDecorator1 extends AbstractDecorator<ISalute> implements ISalute {
    salute(): string {
        return `MyFirstSalute<${this.decoratee.salute()}>`;
    }
}
makeInjectable(MySimpleDecorator1);

class MySimpleDecorator2 extends AbstractDecorator<ISalute> implements ISalute {
    salute(): string {
        return `MySecondSalute<${this.decoratee.salute()}>`;
    }
}
makeInjectable(MySimpleDecorator2);

/**
 * Decorators with dependencies
 */

const IMessageProviderSymbol = Symbol.for("IMessageProvider");

interface IMessageProvider {
    getMessage(): string;
}

const ISuffixProviderSymbol = Symbol.for("ISuffixProvider");

interface ISuffixProvider {
    getSuffix(): string;
}

class MyComplexDecorator1 extends AbstractDecorator<ISalute> implements ISalute {
    private messageProvider: IMessageProvider;

    constructor(provider: IMessageProvider) {
        super();
        this.messageProvider = provider;
    }

    salute(): string {
        return `${this.messageProvider.getMessage()}:${this.decoratee.salute()}`;
    }
}
makeInjectable(MyComplexDecorator1, [inject(IMessageProviderSymbol)]);

class MyComplexDecorator2 extends AbstractDecorator<ISalute> implements ISalute {
    private suffixProvider: ISuffixProvider;

    constructor(suffixProvider: ISuffixProvider) {
        super();
        this.suffixProvider = suffixProvider;
    }

    salute(): string {
        return `MyComplexSalute<${this.decoratee.salute()}:${this.suffixProvider.getSuffix()}>`;
    }
}
makeInjectable(MyComplexDecorator2, [inject(ISuffixProviderSymbol)]);

class MessageProvider implements IMessageProvider {
    getMessage(): string {
        return "prefix";
    }
}
makeInjectable(MessageProvider);

class SuffixProvider implements ISuffixProvider {
    getSuffix(): string {
        return "suffix";
    }
}
makeInjectable(SuffixProvider);
