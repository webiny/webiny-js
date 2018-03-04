export default ({ image, transformations }) => {
    for (let i = 0; i < transformations.length; i++) {
        const { action, ...params } = transformations[i];
        switch (action) {
            case "resize":
            // resize image
            case "crop":
            // crop image
            case "radius":
            // add border radius
        }
    }
    return image;
};
