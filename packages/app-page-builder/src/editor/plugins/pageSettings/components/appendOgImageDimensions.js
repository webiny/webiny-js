const OG_IMAGE_DIMENSIONS_PROPERTIES = ["image:width", "image:height"];

export default async ({ form, value }) => {
    if (!value || value.src.startsWith("data:")) {
        form.setState(state => {
            const next = { ...state };
            // Remove previously set og:image:width / og:image:height.
            next.data.settings.social.meta = next.data.settings.social.meta.filter(item => {
                return item.property && !OG_IMAGE_DIMENSIONS_PROPERTIES.includes(item.property);
            });
            return next;
        });
        return;
    }

    const image = await new Promise(function(resolve, reject) {
        let image = new window.Image();
        image.onload = function() {
            resolve(image);
        };
        image.onerror = reject;
        image.src = value.src;
    });

    form.setState(state => {
        const next = { ...state };
        // Remove previously set og:image:width / og:image:height.
        if (Array.isArray(next.data.settings.social.meta)) {
            next.data.settings.social.meta = next.data.settings.social.meta.filter(item => {
                return !OG_IMAGE_DIMENSIONS_PROPERTIES.includes(item.property);
            });
        } else {
            next.data.settings.social.meta = [];
        }

        next.data.settings.social.meta.push(
            {
                property: "og:image:width",
                content: String(image.width)
            },
            {
                property: "og:image:height",
                content: String(image.height)
            }
        );

        return next;
    });
};
