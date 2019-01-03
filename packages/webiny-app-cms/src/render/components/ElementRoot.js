// @flow
import React from "react";
import { get } from "dot-prop-immutable";
import { isEqual } from "lodash";
import { getPlugins } from "webiny-plugins";
import type {
    CmsRenderElementStylePluginType,
    CmsRenderElementAttributesPluginType
} from "webiny-app-cms/types";

const Node = "div";

const combineClassNames = (...styles) => {
    return styles.filter(s => s !== "" && s !== "css-0").join(" ");
};

class ElementRoot extends React.Component<*> {
    stylePlugins: Array<CmsRenderElementStylePluginType>;
    attributePlugins: Array<CmsRenderElementAttributesPluginType>;
    constructor() {
        super();
        this.stylePlugins = getPlugins("cms-render-element-style");
        this.attributePlugins = getPlugins("cms-render-element-attributes");
    }

    shouldComponentUpdate(props: Object) {
        return !isEqual(props.element.data, this.props.element.data);
    }

    render() {
        const { element, style = {}, children, className = null } = this.props;

        const shallowElement = { id: element.id, type: element.type, data: element.data };

        const finalStyle = this.stylePlugins.reduce((style, pl) => {
            return pl.renderStyle({ element: shallowElement, style });
        }, style);

        const attributes = this.attributePlugins.reduce((attributes, pl) => {
            return pl.renderAttributes({ element: shallowElement, attributes });
        }, {});
        
        const classNames = get(element, "data.settings.className", "");

        const getAllClasses = (...extraClasses) => {
            return [className, ...extraClasses, ...classNames.split(" ")]
                .filter(v => v && v !== "css-0")
                .join(" ");
        };

        if (typeof children === "function") {
            return children({
                getAllClasses,
                combineClassNames,
                elementStyle: finalStyle,
                elementAttributes: attributes,
                customClasses: classNames.split(" ")
            });
        }

        return (
            <Node className={getAllClasses()} style={finalStyle} {...attributes}>
                {children}
            </Node>
        );
    }
}

export { ElementRoot };
