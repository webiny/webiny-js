const MATCH_STRING = "the stack is currently locked by";

module.exports = ({ error }) => {
    const { message } = error;

    if (typeof message === "string" && message.includes(MATCH_STRING)) {
        return [
            `The Pulumi error you've just experienced can occur`,
            `if one of the previous deployments has been interrupted, or another deployment`,
            `is already in progress. Learn more: https://webiny.link/locked-stacks.`
        ].join(" ");
    }
};
