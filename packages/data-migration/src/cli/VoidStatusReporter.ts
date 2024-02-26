import { MigrationStatusReporter } from "./MigrationStatusReporter";

export class VoidStatusReporter implements MigrationStatusReporter {
    report(): void {
        // This is a void reporter.
    }
}
