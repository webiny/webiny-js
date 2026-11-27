import { createFeature } from "@webiny/feature/api";
import { SmtpMailTransportFactory } from "./SmtpMailTransportFactory.js";

export const SmtpTransportFeature = createFeature({
    name: "SmtpTransport",
    register(container) {
        container.register(SmtpMailTransportFactory).inSingletonScope();
    }
});
