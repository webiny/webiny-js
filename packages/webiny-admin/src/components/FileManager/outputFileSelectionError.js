export default errors => {
    if (errors.length > 1) {
        return "Multiple invalid files selected.";
    }

    switch (errors[0].type) {
        case "unsupportedFileType":
            return "Unsupported file type.";
        case "maxSizeExceeded":
            return "Max size exceeded.";
        case "multipleMaxCountExceeded":
            return "Multiple max files exceeded.";
        case "multipleMaxSizeExceeded":
            return "Multiple max size exceeded.";
        case "multipleNotAllowed":
            return "Only one file allowed.";
    }
};
