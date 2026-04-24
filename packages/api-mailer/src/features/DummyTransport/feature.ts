import { createFeature } from "@webiny/feature/api";
import { DummyMailTransportFactory } from "./DummyMailTransportFactory.js";

export const DummyTransportFeature = createFeature({
    name: "Mailer/DummyTransport",
    register(container) {
        container.register(DummyMailTransportFactory).inSingletonScope();
    }
});
