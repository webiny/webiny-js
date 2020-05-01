export default async (context, pat) => {
    try {
        if (!pat) {
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

        const returnedUser = {
            id: user.id,
            type: "user",
            access: await user.access
        };

        return returnedUser;
    } catch (e) {
        console.log(e);
    }
};
