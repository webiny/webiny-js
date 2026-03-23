/**
 * Minimal UI interface for MCP output.
 * This is a structural subtype of @webiny/cli-core's IUiService,
 * so Webiny's Ui can be passed directly without an adapter.
 */
export interface IUi {
    info(text: string, ...args: any[]): void;
    success(text: string, ...args: any[]): void;
    error(text: string, ...args: any[]): void;
    warning(text: string, ...args: any[]): void;
    text(text: string): void;
    emptyLine(): void;
}

/**
 * Console-based Ui for standalone usage (no @webiny/cli-core needed).
 */
export class ConsoleUi implements IUi {
    info(text: string, ...args: any[]): void {
        console.log(text, ...args);
    }

    success(text: string, ...args: any[]): void {
        console.log(text, ...args);
    }

    error(text: string, ...args: any[]): void {
        console.error(text, ...args);
    }

    warning(text: string, ...args: any[]): void {
        console.warn(text, ...args);
    }

    text(text: string): void {
        console.log(text);
    }

    emptyLine(): void {
        console.log();
    }
}
