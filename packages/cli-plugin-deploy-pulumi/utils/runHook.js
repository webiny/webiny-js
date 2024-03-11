const processHooks = require("./processHooks");

module.exports = async function runHook({ hook, skip, args, context }) {
    if (skip) {
        context.info(`Skipped "${hook}" hook.`);
    } else {
        context.info(`Running "${hook}" hook...`);
        await processHooks(hook, args);
        context.info(`Hook "${hook}" completed.`);
    }
};
