/**
 * Below this mean opacity a background image is see-through: the colour behind it is what shows.
 *
 * Swept over every background image on the planned pages of five sites (139 read, 1 unreadable):
 * photographs and opaque artwork all measure 1.00; ten measure 0.33 or less — two faint patterns
 * (0.11, 0.12), a page texture (0.05), two inline SVGs, a sprite and four logos. Nothing lies between,
 * so every threshold above 0.33 and up to 1.0 classifies them identically; 0.5 sits in the gap. A
 * logo counts as see-through by this measure, which is right for colour — the colour around it shows —
 * and is why the wording for these says "mostly see-through" rather than "pattern".
 *
 * Not a tuning parameter. The gap is a property of the images: an image is either drawn opaque or
 * drawn as a tint. Do not revisit this value unless that distribution changes — an image that measures
 * strictly between 0.33 and 1.00 — and then sweep again over every background image, not a sample.
 */
export const TRANSLUCENT_BELOW = 0.5;

export const isTranslucent = (image: { opacity?: number }): boolean =>
    image.opacity !== undefined && image.opacity < TRANSLUCENT_BELOW;
