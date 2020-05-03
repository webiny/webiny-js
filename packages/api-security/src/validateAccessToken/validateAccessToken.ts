export default async (context, pat) => {
    if (!pat || typeof pat !== "string") {
        return null;
    }

    pat = pat.toLowerCase();
    const token = await context.models.SecurityPersonalAccessToken.findOne({
        query: { token: pat }
    });

    const user = await token.user;
    if (!user) {
        return null;
    }

    return {
        id: user.id,
        type: "user",
        access: await user.access
    };
};
