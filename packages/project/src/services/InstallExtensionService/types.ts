/**
 * Schema for Webiny extension.json configuration files.
 * Based on: https://github.com/webiny/extensions/blob/main/schemas/extension.schema.json
 */
export interface ExtensionJson {
    $schema?: string;
    /**
     * The unique name of the extension.
     */
    name: string;
    /**
     * The type of extension.
     */
    type: "admin" | "api" | "cli" | "infra";
    /**
     * Configuration for how this extension integrates with webiny.config.tsx.
     */
    webinyConfigTsx?: ExtensionWebinyConfigTsx;
    /**
     * Next steps to display after installation (legacy support).
     */
    nextSteps?: ExtensionMessagesConfig;
    /**
     * Additional notes and messages for the extension.
     */
    additionalNotes?: ExtensionMessagesConfig;
    /**
     * Additional package.json properties to merge.
     */
    packageJson?: Record<string, any>;
}

export interface ExtensionWebinyConfigTsx {
    /**
     * Array of imports to add to the user's webiny.config.tsx.
     */
    imports?: ExtensionImport[];
    /**
     * Component to render in the Extensions component.
     */
    component?: ExtensionComponent;
    /**
     * Multiple components to render in the Extensions component.
     */
    components?: ExtensionComponent[];
}

export interface ExtensionImport {
    /**
     * The named import specifier (e.g., 'AdminLogo').
     */
    specifier: string;
    /**
     * The relative path to import from (e.g., './extensions/AdminLogo/AdminLogo.js').
     */
    path: string;
}

export interface ExtensionComponent {
    /**
     * The component name to render (should match one of the imported specifiers).
     */
    name: string;
    /**
     * Props to pass to the component (optional).
     */
    props?: Record<string, any>;
}

export interface ExtensionMessage {
    /**
     * Message text (can include %s placeholders for variables).
     */
    text: string;
    /**
     * Variables to substitute into the message text.
     */
    variables?: string[];
}

export interface ExtensionMessagesConfig {
    /**
     * Array of messages to display to users.
     */
    messages?: ExtensionMessage[];
}
