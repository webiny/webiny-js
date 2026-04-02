import React from "react";
import { Command, RegisterFeature, createFeature } from "webiny/admin";
import { SendMessageDetailView } from "./SendMessageDetailView.js";

interface SendMessageParams {
    recipient: string;
    message: string;
}

class SendMessageCommand implements Command.Interface {
    name = "send-message";
    label = "Send Message";
    description = "Send a message to someone";
    category = "Demo";
    keywords = ["send", "message", "form"];
    shortcut = "cmd+shift+m";
    detailView = SendMessageDetailView;

    execute(params?: unknown) {
        const { recipient, message } = params as SendMessageParams;
        alert(`Message sent to ${recipient}: "${message}"`);
    }
}

const SendMessageCommandImpl = Command.createImplementation({
    implementation: SendMessageCommand,
    dependencies: []
});

const SendMessageCommandFeature = createFeature({
    name: "SendMessageCommand",
    register(container) {
        container.register(SendMessageCommandImpl);
    }
});

export default () => {
    return <RegisterFeature feature={SendMessageCommandFeature} />;
};
