import {
    PageBuilderFormDataFileItem,
    PageBuilderFormDataSettings,
    PageBuilderFormDataSettingsSocialMeta
} from "~/types";

const OG_IMAGE_DIMENSIONS_PROPERTIES = ["og:image:width", "og:image:height"];
import get from "lodash/get";

interface Params {
    data: PageBuilderFormDataSettings;
    value?: PageBuilderFormDataFileItem;
    setValue: (value: string, meta: PageBuilderFormDataSettingsSocialMeta[]) => void;
}
const appendOgImageDimensions = async ({ data, value, setValue }: Params) => {
    let meta: PageBuilderFormDataSettingsSocialMeta[] = [];
    if (Array.isArray(get(data, "settings.social.meta"))) {
        meta = [...data.settings.social.meta];
        meta = data.settings.social.meta.filter(item => {
            return !OG_IMAGE_DIMENSIONS_PROPERTIES.includes(item.property);
        });
    }

    if (!value || value.src.startsWith("data:")) {
        return;
    }

    const image = await new Promise<HTMLImageElement>(function (resolve, reject) {
        const image = new window.Image();
        image.onload = function () {
            resolve(image);
        };
        image.onerror = reject;
        image.src = value.src;
    });

    meta.push(
        {
            property: "og:image:width",
            content: String(image.width)
        },
        {
            property: "og:image:height",
            content: String(image.height)
        }
    );

    setValue("settings.social.meta", meta);
};

export default appendOgImageDimensions;
