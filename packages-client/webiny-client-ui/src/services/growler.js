import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";
import { LazyLoad } from "webiny-client";

// These will be lazy loaded when first growl is performed
let GrowlComponents = null;
let GrowlContainer = null;

function getGrowler() {
    if (!GrowlContainer) {
        document.body.appendChild(document.createElement("webiny-growler"));
        return new Promise(resolve => {
            const growlContainer = (
                <LazyLoad modules={["Growl"]}>
                    {({ Growl }) => {
                        GrowlComponents = Growl;
                        return (
                            <GrowlComponents.Container
                                onComponentDidMount={ref => {
                                    GrowlContainer = ref;
                                    resolve(GrowlContainer);
                                }}
                            />
                        );
                    }}
                </LazyLoad>
            );
            ReactDOM.render(growlContainer, document.querySelector("webiny-growler"));
        });
    }

    return Promise.resolve(GrowlContainer);
}

function Growler(component) {
    return getGrowler().then(growler => growler.addGrowl(component));
}

_.assign(Growler, {
    async remove(growlId) {
        const growler = await getGrowler();

        if (!growler) {
            return null;
        }

        growler.removeById(growlId);
    },

    async info(message, title = "Info", sticky = false, ttl = 3000) {
        const growler = await getGrowler();

        if (!growler) {
            return null;
        }

        return growler.addGrowl(<GrowlComponents.Info {...{ message, title, sticky, ttl }} />);
    },

    async success(message, title = "Success", sticky = false, ttl = 3000) {
        const growler = await getGrowler();

        if (!growler) {
            return null;
        }

        return growler.addGrowl(<GrowlComponents.Success {...{ message, title, sticky, ttl }} />);
    },

    async danger(message, title = "Danger", sticky = true, ttl = 3000) {
        const growler = await getGrowler();

        if (!growler) {
            return null;
        }

        return growler.addGrowl(<GrowlComponents.Danger {...{ message, title, sticky, ttl }} />);
    },

    async warning(message, title = "Warning", sticky = true, ttl = 3000) {
        const growler = await getGrowler();

        if (!growler) {
            return null;
        }

        return growler.addGrowl(<GrowlComponents.Warning {...{ message, title, sticky, ttl }} />);
    }
});

export default Growler;
