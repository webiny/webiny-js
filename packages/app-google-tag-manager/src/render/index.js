import React, { useEffect } from "react";
import { Query } from "react-apollo";
import query from "./graphql";

function GoogleTagManager({ settings }) {
    useEffect(() => {
        if (!settings || settings.enabled !== true || window.dataLayer) {
            return;
        }

        document.querySelector("body").prepend(
            new window.DOMParser().parseFromString(
                `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${settings.code}"
                  height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`,
                "text/xml"
            ).firstChild
        );

        (function(w, d, s, l, i) {
            w[l] = w[l] || [];
            w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
            var f = d.getElementsByTagName(s)[0],
                j = d.createElement(s),
                dl = l != "dataLayer" ? "&l=" + l : "";
            j.async = true;
            j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
            f.parentNode.insertBefore(j, f);
        })(window, document, "script", "dataLayer", settings.code);
    }, []);

    return null;
}

export default [
    {
        type: "addon-render",
        name: "addon-render-google-tag-manager",
        component: (
            <Query query={query}>
                {({ data, loading }) => {
                    return loading ? null : (
                        <GoogleTagManager settings={data.googleTagManager.getSettings.data} />
                    );
                }}
            </Query>
        )
    }
];
