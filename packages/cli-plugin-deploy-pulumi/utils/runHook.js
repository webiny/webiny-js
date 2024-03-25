const processHooks = require("./processHooks");

module.exports = async function runHook({ hook, skip, args, context }) {
    if (skip) {
        context.info(`Skipped %s hook.`, hook);
    } else {
        context.info(`Running %s hook...`, hook);
        await processHooks(hook, args);
        context.info(`Hook %s completed.`, hook);
    }
};
