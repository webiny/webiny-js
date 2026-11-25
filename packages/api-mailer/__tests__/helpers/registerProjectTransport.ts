import type { Container } from "@webiny/di";
import { MailTransport } from "~/domain/MailTransport/abstractions.js";
import { MailTransportFactory } from "~/domain/MailTransport/abstractions.js";

/*
 * A transport the project registers, configured outside the mailer settings (for example from
 * environment variables). With `send` null it is not configured.
 */
export const registerProjectTransport = (send: MailTransport.Interface["send"] | null) => {
    class ProjectTransportFactory implements MailTransportFactory.Interface {
        public readonly name = "Project/Transport";

        async createTransport() {
            if (!send) {
                return null;
            }
            return { name: this.name, send };
        }
    }

    return (container: Container) => {
        const implementation = MailTransportFactory.createImplementation({
            implementation: ProjectTransportFactory,
            dependencies: []
        });
        container.register(implementation);
    };
};
