export interface CliParams {
    /** Project name (positional argument) */
    projectName: string;

    /** Force project creation within an existing folder */
    force: boolean;

    /** Name of template to use (defaults to "aws") */
    template: string;

    /** Hosting type: "aws" or "server" (self-hosted). Used in non-interactive mode. */
    hostingType: "aws" | "server";

    /** JSON string with template-specific options */
    templateOptions: string | null;

    /** JSON string with additional options for yarnrc.yml */
    assignToYarnrc: string | null;

    /** NPM tag to use for @webiny packages (defaults to "latest") */
    tag: string;

    /** Enable interactive mode */
    interactive: boolean;

    /** Log file path (defaults to "create-webiny-project-logs.txt") */
    log: string;

    /** Enable debug logging */
    debug: boolean;

    /** If an error occurs, deletes all generated files (defaults to true) */
    cleanup: boolean;
}
