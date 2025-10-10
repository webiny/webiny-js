import { WebinyPackage } from "../WebinyPackage";

/**
 * Abstract base class for all file or code generators.
 * Provides a consistent interface and shared utilities
 * for generators operating on a Webiny package.
 */
export abstract class AbstractGenerator {
    protected webinyPackage: WebinyPackage;

    constructor(webinyPackage: WebinyPackage) {
        this.webinyPackage = webinyPackage;
    }

    /**
     * Run the generator. Must be implemented by subclasses.
     */
    abstract generate(): Promise<void>;

    /**
     * Utility: Get the root path of the package.
     */
    protected getRootPath(): string {
        return this.webinyPackage.paths.rootFolder;
    }

    /**
     * Utility: Log a message for visibility when running generators.
     */
    protected log(message: string): void {
        console.log(message);
    }
}
