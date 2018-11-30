// @flow
import argumentProcessors from "./argumentProcessors";
import assetLoaders from "./assetLoaders";

export default async (...args: Array<any>) => {
    return new Promise(async resolve => {
        outerLoop: for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            let eligibleProcessor = null;
            argumentProcessors.forEach(processor => {
                if (processor.canProcess(arg)) {
                    eligibleProcessor = processor;
                    return false;
                }
            });

            if (!eligibleProcessor) {
                throw Error("Cannot process load argument: " + arg);
            }

            const processedArgument = eligibleProcessor.process(arg);

            for (let j = 0; j < assetLoaders.length; j++) {
                let assetLoader = assetLoaders[j];
                if (assetLoader.canProcess(processedArgument)) {
                    await assetLoader.process(processedArgument);
                    continue outerLoop;
                }
            }

            throw Error("Cannot load given argument " + JSON.stringify(processedArgument));
        }

        resolve();
    });
};
