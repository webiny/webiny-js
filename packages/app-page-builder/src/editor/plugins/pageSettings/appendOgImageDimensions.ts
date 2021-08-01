const OG_IMAGE_DIMENSIONS_PROPERTIES = ["og:image:width", "og:image:height"];
import { get } from "lodash";

export default async ({ data, value, setValue }) => {
    let meta = [];
    if (Array.isArray(get(data, "settings.social.meta"))) {
        meta = [...data.settings.social.meta];
        meta = data.settings.social.meta.filter(item => {
            return !OG_IMAGE_DIMENSIONS_PROPERTIES.includes(item.property);
        });
    }

    if (!value || value.src.startsWith("data:")) {
        return;
    }

    const image: any = await new Promise(function(resolve, reject) {
        const image = new window.Image();
        image.onload = function() {
            resolve(image);
        };
        image.onerror = reject;
        image.src = value.src;
    });

    console.log("image", image);

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

    console.log("meta", meta);

    setValue("settings.social.meta", meta);
};
