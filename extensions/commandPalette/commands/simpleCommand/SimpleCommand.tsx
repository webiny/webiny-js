import React from "react";
import { Command, RegisterFeature, createFeature } from "webiny/admin";

class SayHelloCommand implements Command.Interface {
    name = "say-hello";
    label = "Say Hello";
    description = "Displays a greeting in the console";
    category = "Demo";
    keywords = ["hello", "greet", "demo"];

    execute() {
        alert("Hello from the Command Palette!");
    }
}

const SayHelloCommandImpl = Command.createImplementation({
    implementation: SayHelloCommand,
    dependencies: []
});

const SayHelloCommandFeature = createFeature({
    name: "SayHelloCommand",
    register(container) {
        container.register(SayHelloCommandImpl);
    }
});

export default () => {
    return <RegisterFeature feature={SayHelloCommandFeature} />;
};
