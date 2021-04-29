declare global {
    interface Window {
        __PS_RENDER_TENANT__: string;
        __PS_RENDER_LOCALE__: string;
    }
}

export default () => {
    const query = new URLSearchParams(location.search);
    const tenant = query.get("__tenant") || window.__PS_RENDER_TENANT__;
    const locale = query.get("__locale") || window.__PS_RENDER_LOCALE__;

    return [
        {
            type: "apollo-link",
            name: "apollo-link-tenant",
            createLink() {
                return (operation, forward) => {
                    if (tenant) {
                        operation.setContext({
                            headers: {
                                "x-tenant": tenant
                            }
                        });
                    }

                    // Call the next link in the middleware chain.
                    return forward(operation);
                };
            }
        },
        {
            type: "apollo-link",
            name: "apollo-link-locale",
            createLink() {
                return (operation, forward) => {
                    if (locale) {
                        operation.setContext({
                            headers: {
                                "x-i18n-locale": `content:${locale};`
                            }
                        });
                    }

                    // Call the next link in the middleware chain.
                    return forward(operation);
                };
            }
        }
    ];
};
