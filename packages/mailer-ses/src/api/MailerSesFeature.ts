import { createFeature } from "@webiny/feature/api";
import { SesMailTransportFactory } from "./SesMailTransportFactory.js";

export const MailerSesFeature = createFeature({
    name: "MailerSes",
    register(container) {
        container.register(SesMailTransportFactory).inSingletonScope();
    }
});
