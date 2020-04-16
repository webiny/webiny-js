export default async (context, PAT) => {
    try {
        if (!PAT) {
            return null;
        }

        PAT = PAT.toLowerCase();
        const token = await context.models.SecurityPersonalAccessToken.findOne({
            query: { token: PAT }
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
