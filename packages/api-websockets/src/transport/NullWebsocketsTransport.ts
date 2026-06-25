import { WebsocketsTransport } from "./abstractions/WebsocketsTransport.js";

class NullWebsocketsTransportImpl implements WebsocketsTransport.Interface {
    public async send(): Promise<void> {
        return;
    }

    public async disconnect(): Promise<void> {
        return;
    }
}

export const NullWebsocketsTransport = WebsocketsTransport.createImplementation({
    implementation: NullWebsocketsTransportImpl,
    dependencies: []
});
