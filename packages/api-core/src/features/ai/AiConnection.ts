import { createImplementation } from "@webiny/feature/api";
import { AiConnection as AiConnectionAbstraction } from "./abstractions.js";
import { AiConnectionFactory as AiConnectionFactoryAbstraction } from "./abstractions.js";
import type { IAiConnection } from "./abstractions.js";

interface AiConnectionConfig {
    id: string;
    sdkName: string;
    apiKey?: string;
}

export function createAiConnection(config: AiConnectionConfig) {
    class AiConnectionImpl implements IAiConnection {
        readonly id = config.id;
        readonly sdkName = config.sdkName;
        readonly apiKey = config.apiKey;
    }

    return createImplementation({
        abstraction: AiConnectionAbstraction,
        implementation: AiConnectionImpl,
        dependencies: []
    });
}

export function createAiConnectionFactory(factory: { execute(): Promise<IAiConnection> }) {
    class AiConnectionFactoryImpl implements AiConnectionFactoryAbstraction.Interface {
        execute() {
            return factory.execute();
        }
    }

    return createImplementation({
        abstraction: AiConnectionFactoryAbstraction,
        implementation: AiConnectionFactoryImpl,
        dependencies: []
    });
}
