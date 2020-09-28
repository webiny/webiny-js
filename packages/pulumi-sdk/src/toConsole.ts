type LineProcessor = (line: string) => string;

const processors: Array<LineProcessor | [(line: string) => boolean, LineProcessor]> = [
    line => line.replace(/  +/g, " "),
    line => line.trim(),
    [line => line.startsWith("pulumi:pulumi:Stack"), () => " "]
];

const log = async std => {
    for await (const chunk of std) {
        let line = String(chunk);

        for (let i = 0; i < processors.length; i++) {
            let processLine = processors[i];
            if (Array.isArray(processLine)) {
                const [canProcess, processFn] = processLine;
                if (!canProcess(line)) {
                    continue;
                }
                processLine = processFn;
            }

            line = processLine(line);
        }

        line && console.log(line);
    }
};

export default async subProcess => {
    await log(subProcess.stdout);
    await log(subProcess.stderr);
};
