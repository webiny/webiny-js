function rgbToHsl(r, g, b) {
    // Convert RGB values (0-255 range) to the range of 0-1
    r /= 255;
    g /= 255;
    b /= 255;

    const maxVal = Math.max(r, g, b);
    const minVal = Math.min(r, g, b);
    const delta = maxVal - minVal;

    let h = 0,
        s = 0,
        l = (maxVal + minVal) / 2;

    if (delta !== 0) {
        s = delta / (1 - Math.abs(2 * l - 1));

        if (maxVal === r) {
            h = ((g - b) / delta) % 6;
        } else if (maxVal === g) {
            h = (b - r) / delta + 2;
        } else {
            h = (r - g) / delta + 4;
        }

        h = Math.round(h * 60); // Convert to degrees
        if (h < 0) {
            h += 360;
        }
    }

    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);

    return { h, s, l };
}

function figmaRgbaToHsla(figmaColor) {
    const { r, g, b, a } = figmaColor;

    // Convert normalized RGBA to standard RGB (0-255)
    const red = Math.round(r * 255);
    const green = Math.round(g * 255);
    const blue = Math.round(b * 255);

    // Get the HSL values
    const { h, s, l } = rgbToHsl(red, green, blue);

    // Return the HSLA value
    return { h, s, l, a };
}

module.exports = { figmaRgbaToHsla };
