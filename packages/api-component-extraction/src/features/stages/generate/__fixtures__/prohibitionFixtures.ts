import { readFileSync } from "node:fs";
import type { PlannedComponent } from "~/domain/artifacts.js";

/**
 * Stored plans that between them show all three content prohibitions: thevibe's Hero Intro (observed
 * a stored plan), the same plan with an observed logo, and with an opaque background photograph and a see-through pattern.
 */
const hero = JSON.parse(
    readFileSync(new URL("./thevibe-hero-intro.plan.json", import.meta.url), "utf8")
) as PlannedComponent;

const photo = {
    url: "https://cs-cdn.realpage.com/CWS/2623272/images/154711922.jpg",
    size: "cover",
    position: "50% 50%",
    repeat: "no-repeat",
    area: 921600,
    opacity: 1
};
const pattern = {
    url: "https://g5-assets-cld-res.cloudinary.com/uploads/Denver_Background_Tertiary_bnx4vk.png",
    size: "cover",
    area: 921600,
    opacity: 0.12,
    under: { hex: "#f7f7f9", token: null }
};

// The Freehill header's logo prop, as Plan bound it: an observed image, so the image-URL line shows.
const logo = {
    name: "logo",
    type: "Image",
    array: false,
    optional: false,
    observedValues: [],
    observedStructured: [
        {
            kind: "media",
            src: "https://res.cloudinary.com/g5-assets-cld/image/upload/Logo_xkmkne.png",
            alt: "Freehill Street Lofts"
        }
    ]
};

export const PROHIBITION_FIXTURES: Record<string, PlannedComponent> = {
    hero,
    logo: { ...hero, props: [...hero.props, logo] } as unknown as PlannedComponent,
    photo: { ...hero, backgroundImages: [photo] } as unknown as PlannedComponent,
    pattern: { ...hero, backgroundImages: [pattern] } as unknown as PlannedComponent
};
