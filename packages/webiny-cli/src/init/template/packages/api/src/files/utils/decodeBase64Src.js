// @flow
const decodeBase64Src = (dataString: string): { type: string, buffer: Buffer } => {
    // eslint-disable-next-line
    const matches: ?Array<string> = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    const response = {};

    if (!Array.isArray(matches)) {
        throw Error("Invalid input string");
    }

    if (!matches[1]) {
        throw Error("Could not read file type.");
    }

    if (!matches[2]) {
        throw Error("Could not read file content.");
    }

    response.type = matches[1];
    response.buffer = new Buffer(matches[2], "base64");

    return response;
};

export default decodeBase64Src;
