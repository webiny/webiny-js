import type { WebinyConfig } from "@webiny/sdk";
import { Result, HttpError, ApiError, NetworkError } from "@webiny/sdk";
// @ts-expect-error No types available
import * as csstree from "css-tree";

export interface RemoteComponentEntry {
    id: string;
    name: string;
    label: string;
    bundledJs: string;
    bundledJsSha256: string;
    bundledCss: string;
    bundledCssSha256: string;
    sdkVersion: string;
    status: string;
}

export interface LoadComponentsOptions {
    fetchOptions?: RequestInit;
}

export interface HydrateComponentDependencies {
    sdk: unknown;
    React: unknown;
}

export interface HydrateComponentOptions {
    tenantId?: string;
    locale?: string;
    mode?: "server" | "browser";
}

export interface HydratedComponent {
    component: any;
    manifest: any;
    css: string;
    scopeClassName: string;
}

const LIST_REMOTE_COMPONENTS = /* GraphQL */ `
    query ListRemoteComponents {
        remoteComponents {
            listRemoteComponents {
                data {
                    id
                    name
                    label
                    bundledJs
                    bundledJsSha256
                    bundledCss
                    bundledCssSha256
                    sdkVersion
                    status
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

interface ListRemoteComponentsResponse {
    remoteComponents: {
        listRemoteComponents: {
            data: RemoteComponentEntry[] | null;
            error: { code: string; message: string } | null;
        };
    };
}

export class ComponentsSdk {
    private config: WebinyConfig;
    private fetchFn: typeof fetch;

    constructor(config: WebinyConfig) {
        this.config = config;
        this.fetchFn = config.fetch ?? fetch;
    }

    async loadComponents(
        options?: LoadComponentsOptions
    ): Promise<Result<RemoteComponentEntry[], HttpError | ApiError | NetworkError>> {
        const url = `${this.config.endpoint}/graphql`;

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "x-tenant": this.config.tenant ?? "root",
            ...this.config.headers
        };

        if (this.config.token && !headers.Authorization) {
            const token =
                typeof this.config.token === "function"
                    ? await this.config.token()
                    : this.config.token;
            headers.Authorization = `Bearer ${token}`;
        }

        let response: Response;
        try {
            response = await this.fetchFn(url, {
                method: "POST",
                headers,
                body: JSON.stringify({ query: LIST_REMOTE_COMPONENTS }),
                ...options?.fetchOptions
            });
        } catch (error) {
            return Result.fail(
                new NetworkError(error instanceof Error ? error.message : "Network request failed")
            );
        }

        if (!response.ok) {
            return Result.fail(
                new HttpError(response.status, `HTTP error! status: ${response.status}`)
            );
        }

        let json: { data?: ListRemoteComponentsResponse; errors?: Array<{ message: string }> };
        try {
            json = await response.json();
        } catch {
            return Result.fail(new NetworkError("Failed to parse response JSON"));
        }

        if (json.errors) {
            const error = json.errors[0];
            return Result.fail(new ApiError(error?.message || "GraphQL error"));
        }

        const envelope = json.data?.remoteComponents?.listRemoteComponents;
        if (!envelope) {
            return Result.fail(
                new ApiError(
                    "Unexpected response — is the remote-components API extension deployed?"
                )
            );
        }

        if (envelope.error) {
            return Result.fail(new ApiError(envelope.error.message, envelope.error.code));
        }

        return Result.ok(envelope.data ?? []);
    }

    hydrateComponent(
        entry: RemoteComponentEntry,
        dependencies: HydrateComponentDependencies,
        options?: HydrateComponentOptions
    ): HydratedComponent | null {
        const runtimeSdk = {
            version: "1" as const,
            dependencies: {
                sdk: dependencies.sdk,
                React: dependencies.React
            },
            environment: {
                tenantId: options?.tenantId ?? this.config.tenant ?? "root",
                locale: options?.locale ?? "en-US",
                mode: options?.mode ?? "browser"
            }
        };

        try {
            const fn = new Function(`
                var __remoteComponent__;
                ${entry.bundledJs}
                return __remoteComponent__;
            `);
            const mod = fn();

            /*
             * Each way this can fail says which one it was.
             *
             * These used to be one silent `if (!component) return null`, and callers drop a null —
             * the Next.js starter does `.filter(Boolean)` — so a component could vanish leaving no
             * error, no warning and no count anywhere. The only visible symptom was an "Unknown
             * component" warning later, from a different package, naming a component nothing had
             * said had failed. Three different causes presented identically.
             */
            if (!mod) {
                console.error(
                    `[ComponentsSdk] "${entry.name}" defined no __remoteComponent__ — its bundle is not a component bundle.`
                );
                return null;
            }
            if (typeof mod.createComponent !== "function") {
                console.error(
                    `[ComponentsSdk] "${entry.name}" exports no createComponent — found: ${Object.keys(mod).join(", ") || "nothing"}.`
                );
                return null;
            }

            const component = mod.createComponent(runtimeSdk);
            if (!component) {
                console.error(
                    `[ComponentsSdk] "${entry.name}" createComponent returned ${String(component)} — it builds nothing.`
                );
                return null;
            }
            if (!component.component) {
                console.error(
                    `[ComponentsSdk] "${entry.name}" createComponent returned no component — keys: ${Object.keys(component).join(", ") || "none"}.`
                );
                return null;
            }

            const scopeClass = toScopeClassName(entry.name);
            const R = dependencies.React as typeof import("react");
            const OriginalComponent = component.component;

            const ScopedComponent = (props: Record<string, unknown>) =>
                R.createElement(
                    "div",
                    { className: scopeClass },
                    R.createElement(OriginalComponent, props)
                );
            ScopedComponent.displayName = `RemoteScope(${scopeClass})`;

            return {
                component: ScopedComponent,
                /*
                 * `entry.name` is the component's IDENTITY, not a label — it is what a page element
                 * records and what the registry is keyed by, so it is the name a component must be
                 * registered under or no page can resolve it.
                 *
                 * The name inside the bundle is whatever the source declared, which for a generated
                 * component is the model's invention and for any component survives a later rename.
                 * Promote renames on collision ("Hero Banner (4)"), and the server already treats the
                 * promoted name as authoritative: `buildComponentManifest` overrides the manifest name
                 * with it when persisting, and both bundler and runtime scope CSS by it. Re-deriving
                 * the manifest here and keeping the bundle's name was the single place that
                 * disagreed, and it made every page render nothing — 199 of 199 components
                 * unresolvable, silently, while every stage reported success.
                 *
                 * So the rest of the manifest comes from the bundle, which is the authority on inputs
                 * and defaults, and the name comes from the entry, which is the authority on identity.
                 * A caller synthesising an entry is therefore declaring an identity, not labelling
                 * one.
                 */
                manifest: { ...component.manifest, name: entry.name },
                css: entry.bundledCss ?? "",
                scopeClassName: scopeClass
            };
        } catch (error) {
            console.error(`[ComponentsSdk] Failed to hydrate component "${entry.name}":`, error);
            return null;
        }
    }

    scopeCss(rawCss: string, componentName: string): string {
        return scopeCss(rawCss, toScopeClassName(componentName));
    }
}

function toScopeClassName(name: string): string {
    // Slugify to a valid CSS identifier: any run of non-alphanumerics (spaces, "/", punctuation) becomes
    // a single hyphen. This is the class the runtime puts on the component's wrapper element, and it MUST
    // match the class the bundlers scope the CSS to — otherwise a name like "Testimonials with features"
    // yields "rc-testimonials with features" (three classes) and the scoped styles never apply.
    const slug =
        name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || "component";
    return `rc-${slug}`;
}

function scopeCss(rawCss: string, scopeName: string): string {
    if (!rawCss) {
        return "";
    }

    try {
        const ast = csstree.parse(rawCss);

        csstree.walk(ast, {
            visit: "Rule",
            enter(node: any) {
                const selectorList = node.prelude;
                if (!selectorList || selectorList.type !== "SelectorList") {
                    return;
                }

                const newSelectors = new csstree.List();

                selectorList.children.forEach((selector: any) => {
                    const raw = csstree.generate(selector).trim();
                    if (raw.startsWith(":root")) {
                        newSelectors.appendData(selector);
                        return;
                    }

                    const scoped = csstree.parse(`.${scopeName} ${raw}`, {
                        context: "selector"
                    });
                    newSelectors.appendData(scoped);
                });

                selectorList.children = newSelectors;
            }
        });

        return csstree.generate(ast);
    } catch {
        return rawCss;
    }
}
