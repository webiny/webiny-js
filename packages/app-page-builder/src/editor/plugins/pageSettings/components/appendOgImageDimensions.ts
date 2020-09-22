enum OG_IMAGE {
    WIDTH = "og:image:width",
    HEIGHT = "og:image:height"
}

const OG_IMAGE_DIMENSIONS_PROPERTIES = [OG_IMAGE.WIDTH, OG_IMAGE.HEIGHT];

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

    const image: any = await new Promise(function(resolve, reject) {
        const image = new window.Image();
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
                property: OG_IMAGE.WIDTH,
                content: String(image.width)
            },
            {
                property: OG_IMAGE.HEIGHT,
                content: String(image.height)
            }
        );

        return next;
    });
};
