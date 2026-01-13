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

export interface ExtensionWebinyConfigTsx {
    /**
     * Array of imports to add to the user's webiny.config.tsx.
     */
    imports?: ExtensionImport[];
    /**
     * Component to render in the Extensions component.
     */
    component?: ExtensionComponent;
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

/**
 * Schema for Webiny extension.jsonc configuration files.
 * Based on: https://github.com/webiny/extensions/blob/main/schemas/extension.schema.json
 */
export interface ExtensionJsonc {
    $schema?: string;
    /**
     * The unique name of the extension.
     */
    name: string;
    /**
     * The type of extension.
     */
    type: "admin" | "api" | "cli" | "infra" | "core";
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

export interface InstallExtensionParams {
    /**
     * The S3 source path of the extension to download.
     */
    source: string;

    /**
     * Callback to display progress messages.
     */
    onProgress?: (message: string) => void;

    /**
     * Callback when installation succeeds.
     */
    onSuccess?: (message: string) => void;

    /**
     * Callback when installation fails.
     */
    onError?: (message: string, error?: any) => void;
}

export interface InstallExtensionResult {
    success: boolean;
    extensionName?: string;
    extensionPaths?: string[];
    nextSteps?: ExtensionMessage[];
    additionalNotes?: ExtensionMessage[];
    error?: Error;
}
