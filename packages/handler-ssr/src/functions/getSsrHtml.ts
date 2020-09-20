export default async (context, ssrFunction, { path }) => {
    const payload = context.handlerClient.invoke({ name: ssrFunction, payload: { path } });
    if (payload.error) {
        throw new Error(payload.body);
    }

    return payload.body;
};
