/**
 * @name Modifier
 * @description I18N Modifier - used for modifying text dynamically.
 */
export type Modifier = {
    name: string,
    execute: Function<string>
};
