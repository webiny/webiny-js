const processHooks = require("./processHooks");

module.exports = async function runHook({ hook, skip, args, context }) {
    if (skip) {
        context.debug(`Skipped "${hook}" hook.`);
    } else {
        context.debug(`Running "${hook}" hook...`);
        await processHooks(hook, args);
        context.debug(`Hook "${hook}" completed.`);
    }
};
