export interface ExtensionImport {
    specifier: string;
    path: string;
}

export interface ExtensionComponent {
    name: string;
}

export interface ExtensionWebinyConfigTsx {
    imports?: ExtensionImport[];
    component?: ExtensionComponent;
}

export interface ExtensionMessage {
    text: string;
    variables?: string[];
}

export interface ExtensionMessagesConfig {
    clearExisting?: boolean;
    messages?: ExtensionMessage[];
}

export interface ExtensionJsonc {
    $schema?: string;
    name: string;
    type: "admin" | "api" | "website" | string;
    webinyConfigTsx?: ExtensionWebinyConfigTsx;
    nextSteps?: ExtensionMessagesConfig;
    additionalNotes?: ExtensionMessagesConfig;
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
