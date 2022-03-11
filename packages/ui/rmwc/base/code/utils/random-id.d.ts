/**
 * Generates a pseudo random string for DOM ids
 * Will return 'test' in the NODE test-env so things like storyshots doesnt break.
 */
export declare const randomId: (prefix?: string | undefined) => string;
