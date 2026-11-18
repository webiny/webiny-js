/**
 * An API Gateway route's name becomes part of Pulumi resource names, so it must be kebab case:
 * lowercase letters and digits in words joined by single hyphens. Checking
 * `kebabCase(name) === name` instead rejected every name with a digit next to a letter, because
 * lodash splits `e2e` into `e-2-e`.
 */
export function isRouteNameAllowed(name: string): boolean {
    return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(name);
}
