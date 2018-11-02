// @flow
import * as React from "react";
import { connect } from "react-redux";
import { isEqual } from "lodash";
import { compose, withHandlers, shouldUpdate, lifecycle } from "recompose";
import { get, set } from "dot-prop-immutable";
import { updateElement } from "webiny-app-cms/editor/actions";
import { Input } from "webiny-ui/Input";
import { Form } from "webiny-form";
import withOEmbedData from "./withOEmbedData";

function appendSDK(props) {
    const { sdk, global, element } = props;
    const { url } = element.data || {};

    if (!sdk || !url || window[global]) {
        return;
    }

    return new Promise(resolve => {
        const script = document.createElement("script");
        script.type = "text/javascript";
        script.src = encodeURI(sdk);
        script.setAttribute("async", "");
        script.setAttribute("charset", "utf-8");
        script.onload = resolve;
        document.body.appendChild(script);
    });
}

function initEmbed(props) {
    const { sdk, init, element } = props;
    if (sdk && element.data.url) {
        if (typeof init === "function") {
            init({
                props,
                node: document.getElementById("cms-embed-" + element.id)
            });
        }
    }
}

type Props = {
    placeholder: string,
    description: string
};

export default compose(
    shouldUpdate((props, nextProps) => {
        return !isEqual(props, nextProps);
    }),
    connect(
        null,
        { updateElement }
    ),
    withOEmbedData(),
    withHandlers({
        onChange: ({ element, updateElement, getOEmbedData }) => async ({ url }: Object) => {
            updateElement({
                element: set(element, "data", { url, oembed: await getOEmbedData(url) })
            });
        }
    }),
    withHandlers({
        renderInput: ({ renderInput, onChange, urlPlaceholder, urlDescription }) => () => {
            if (typeof renderInput === "function") {
                return renderInput();
            }

            return (
                <Form onSubmit={onChange}>
                    {({ submit, Bind }) => (
                        <Bind name={"url"} defaultValue={""} validators={["required"]}>
                            <Input
                                placeholder={urlPlaceholder}
                                description={urlDescription}
                                onBlur={submit}
                            />
                        </Bind>
                    )}
                </Form>
            );
        },
        renderEmbed: ({ renderEmbed, element }) => () => {
            if (typeof renderEmbed === "function") {
                return renderEmbed();
            }

            return (
                <div
                    id={"cms-embed-" + element.id}
                    dangerouslySetInnerHTML={{ __html: element.data.oembed.html }}
                />
            );
        }
    }),
    lifecycle({
        async componentDidMount() {
            await appendSDK(this.props);
            initEmbed(this.props);
        },
        componentDidUpdate() {
            initEmbed(this.props);
        }
    })
)(({ element, renderEmbed, renderInput }: Props) => {
    const { url } = get(element, "data") || {};

    return url ? renderEmbed() : renderInput();
});
