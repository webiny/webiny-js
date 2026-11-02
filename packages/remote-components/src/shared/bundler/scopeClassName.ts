/**
 * The class the component's CSS is scoped to. `sdk-frontend`'s `ComponentsSdk` puts the same class
 * on the component's wrapper element and the editor's browser bundler scopes with it too, so the
 * three have to agree. Changing the rule here alone would leave every scoped rule unmatched.
 */
export function scopeClassName(componentName: string): string {
    return `rc-${componentName.replace(/\//g, "-").toLowerCase()}`;
}
