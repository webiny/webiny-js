/**
 * Thrown inside the step run handler to fail the step with a fixed reason (R146). `run` catches it
 * and writes the failure once; it never leaves the handler.
 */
export class StepRunFailure extends Error {
    public constructor(public readonly reason: string) {
        super(reason);
        this.name = "StepRunFailure";
    }
}
