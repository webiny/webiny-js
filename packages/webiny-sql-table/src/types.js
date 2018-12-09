/**
 * @name CommandOptions
 * @description Options passed on execution of table commands like create, drop, truncate ...
 * @property {boolean} returnSQL Returns generated SQL instead of actually executing the command.
 */
export type CommandOptions = {
    returnSQL?: boolean
};
