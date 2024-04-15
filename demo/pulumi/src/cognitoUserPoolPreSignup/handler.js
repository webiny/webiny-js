/**
 * This handler auto-confirms the user, and marks the email as "verified".
 * This is to simplify the demo implementation.
 */
exports.handler = async event => {
    // Confirm the user.
    event.response.autoConfirmUser = true;

    // Verify email if it's in the request.
    if (event.request.userAttributes.hasOwnProperty("email")) {
        event.response.autoVerifyEmail = true;
    }

    // Verify phone_number if it's in the request.
    if (event.request.userAttributes.hasOwnProperty("phone_number")) {
        event.response.autoVerifyPhone = true;
    }

    return event;
};
