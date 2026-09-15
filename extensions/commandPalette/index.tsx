import React from "react";
import { Command, RegisterFeature, createFeature } from "webiny/admin";

/**
 * Example: add a custom action to the admin command palette (⌘K / Ctrl+K).
 *
 * A command implements `Command.Interface`, is registered in the DI container, and
 * shows up in the palette's Actions area. Set `category` to group it, `keywords` to
 * improve search, and `shortcut` to bind a global hotkey. For a form/flow rendered
 * inside the palette, add a `detailView` React component (see the framework's
 * SendMessage demo).
 */
class GreetCommand implements Command.Interface {
    name = "example.greet";
    label = "Greet the team";
    description = "Show a friendly greeting";
    category = "Examples";
    keywords = ["hello", "hi", "welcome", "example"];
    shortcut = "cmd+shift+g";

    execute() {
        window.alert("👋 Hello from a custom command palette action!");
    }
}

const GreetCommandImpl = Command.createImplementation({
    implementation: GreetCommand,
    dependencies: []
});

const CommandPaletteExampleFeature = createFeature({
    name: "CommandPaletteExample",
    register(container) {
        container.register(GreetCommandImpl);
    }
});

export default () => {
    return <RegisterFeature feature={CommandPaletteExampleFeature} />;
};
