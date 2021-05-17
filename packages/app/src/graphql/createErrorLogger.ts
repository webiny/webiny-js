import { onError } from "apollo-link-error";

const WEBINY_SHOW_ALERT_ON_ERROR = "wby_show_alert_on_error";

export default () => {
    return onError(({ networkError }) => {
        if (networkError) {
            const alreadyShown = localStorage.getItem(WEBINY_SHOW_ALERT_ON_ERROR);

            if (
                (networkError.name === "ServerError" || networkError.message.includes("500")) &&
                !alreadyShown
            ) {
                localStorage.setItem(WEBINY_SHOW_ALERT_ON_ERROR, "true");
                alert("Something went wrong! Please check browser console for more information.");
            }
        }
    });
};
