/**
 * @name Modifier
 * @description I18N Modifier - used for modifying text dynamically.
 */
export type Modifier = {
    name: string,
    execute: Function<string>
};

/**
 * @name Processor
 * @description I18N Processor - used for outputting text.
 */
export type Processor = {
    name: string,
    execute: Function<string>
};
