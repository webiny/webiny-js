module.exports = {
    admin: {
        Api: {
            Url: "http://localhost:9000/api",
            AggregateRequests: true
        },
        I18n: {
            enabled: false
        }
    },
    frontend: {
        Api: {
            Url: "http://localhost:9000/api",
            AggregateRequests: false
        },
        I18n: {
            enabled: false
        }
    }
};
