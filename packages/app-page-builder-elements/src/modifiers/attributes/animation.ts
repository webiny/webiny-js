import { ElementAttributesModifier } from "~/types";

const initializeAos = () => {
    // Instead of doing these imports at the top of the file, let's import
    // these dependencies only when the attributes modifier is actually used.
    // Additionally, we only want to do this in the browser, hence the window check.
    if (typeof window !== "undefined") {
        new Promise(async () => {
            // @ts-ignore
            await import("aos/dist/aos.css");
            const aos = await import("aos");

            aos.init();
        });
    }
};

const animation: ElementAttributesModifier = ({ element }) => {
    const animation = element.data.settings?.animation;
    if (!animation) {
        return null;
    }

    return Object.keys(animation).reduce((attributes, key) => {
        // Animation `name` doesn't need to append a suffix to the `data-aos` attribute.
        // https://michalsnik.github.io/aos/
        const attributeName = key === "name" ? "data-aos" : `data-aos-${key}`;

        attributes[attributeName] = animation[key];
        return attributes;
    }, {} as Record<string, any>);
};

export const createAnimation = () => {
    // Initialize the AOS library.
    initializeAos();

    return animation;
};
