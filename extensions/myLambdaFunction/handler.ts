export const handler = async (event: any) => {
    console.log("Event received in myLambdaFunction:", event);

    // Simulate some processing
    const result = {
        message: "Hello from myLambdaFunction!",

        input: event
    };

    console.log("Result from myLambdaFunction:", result);

    return result;
};
