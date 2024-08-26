export const expectNotAuthorized = async (
    promise: Promise<any>,
    data: Record<string, any> | null = null
) => {
    await expect(promise).resolves.toMatchObject({
        data: null,
        error: {
            code: "SECURITY_NOT_AUTHORIZED",
            data,
            message: "Not authorized!"
        }
    });
};
