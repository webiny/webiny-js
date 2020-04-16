export default async (context, PAT) => {
    console.log("Inside validateAccessToken...");
    PAT = PAT.toLowerCase();
    console.log("");
    console.log("Received token = ");
    console.log(PAT);
    const token = await context.models.SecurityPersonalAccessToken.findOne({
        query: { token: PAT }
    });
    const user = await token.user;

    console.log("Found user = ");
    console.log(user);

    const returnedUser = {
        id: user.id,
        type: "user",
        access: await user.access
    };
    console.log("Returned user = 111");
    console.log(returnedUser);

    return JSON.stringify(returnedUser);
};
