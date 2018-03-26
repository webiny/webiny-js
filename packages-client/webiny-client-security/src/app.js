import AuthenticationService from "./services/authentication";

export default (config = {}) => {
    return ({ app }, next) => {
        app.services.add(
            "authentication",
            () => new AuthenticationService(config.authentication || {})
        );

        next();
    };
};
