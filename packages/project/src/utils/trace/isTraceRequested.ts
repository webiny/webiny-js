const TRACE_FLAG = "--trace";
const TRACE_FLAG_ASSIGNMENT = `${TRACE_FLAG}=`;

/*
 * Reads the `--trace` flag straight out of `process.argv`, because tracing has to be decided before
 * yargs exists: the phase it is most needed for is the module load that already happened by the time
 * the CLI entrypoint runs its first statement.
 *
 * That means matching what yargs would have concluded for a boolean option. It accepts a bare
 * `--trace`, the assignment form `--trace=true`, and a separated value `--trace false`, so all three
 * have to mean the same thing here as they do in `webiny --help`.
 */
export const isTraceRequested = (argv: string[]): boolean => {
    const index = argv.findIndex(arg => {
        return arg === TRACE_FLAG || arg.startsWith(TRACE_FLAG_ASSIGNMENT);
    });

    if (index === -1) {
        return false;
    }

    const flag = argv[index];
    if (flag.startsWith(TRACE_FLAG_ASSIGNMENT)) {
        return flag !== `${TRACE_FLAG_ASSIGNMENT}false`;
    }

    return argv[index + 1] !== "false";
};
