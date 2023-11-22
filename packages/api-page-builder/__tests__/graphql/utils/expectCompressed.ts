export const expectCompressed = () => {
    return expect.objectContaining({ compression: "gzip", value: expect.any(String) });
};
