// @flow
import { get } from "lodash";
import type { CmsRenderElementAttributesPluginType } from "webiny-app-cms/types";

export default ({
    name: "pb-render-element-attributes-animation",
    type: "pb-render-element-attributes",
    renderAttributes({ element, attributes }) {
        const { animation } = get(element, "data.settings", {});
        if (!animation) {
            return attributes;
        }

        const attrs: Object = { "data-aos": animation.name };

        if (animation.advanced) {
            attrs["data-aos-duration"] = animation.duration;
            attrs["data-aos-delay"] = animation.delay;
            attrs["data-aos-offset"] = animation.offset;
            attrs["data-aos-easing"] = animation.easing;
        }

        return { ...attributes, ...attrs };
    }
}: CmsRenderElementAttributesPluginType);
