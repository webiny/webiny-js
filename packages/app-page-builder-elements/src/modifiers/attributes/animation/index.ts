import { ElementAttributesModifier } from "~/types";

export type CreateAnimationParams = {
    initializeAos: () => void | Promise<void>;
};

export const createAnimation = (params: CreateAnimationParams) => {
    const animation: ElementAttributesModifier = ({ element }) => {
        const animation = element.data.settings?.animation;
        if (!animation) {
            return null;
        }

        new Promise<void>(async resolve => {
            await params.initializeAos();
            resolve();
        });

        return Object.keys(animation).reduce(
            (attributes, key) => {
                // Animation `name` doesn't need to append a suffix to the `data-aos` attribute.
                // https://michalsnik.github.io/aos/
                const attributeName = key === "name" ? "data-aos" : `data-aos-${key}`;

                attributes[attributeName] = animation[key];
                return attributes;
            },
            {} as Record<string, any>
        );
    };

    return animation;
};
