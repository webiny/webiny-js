module.exports = {
    admin: {
        Api: {
            Url: 'http://api.loc:8001/api',
            AggregateRequests: true
        },
        I18n: {
            enabled: false
        }
    },
    frontend: {
        Api: {
            Url: 'http://api.loc:8001/api',
            AggregateRequests: false
        },
        I18n: {
            enabled: false
        }
    },
    userarea: {
        Api: {
            Url: 'http://api.loc:8001/api',
            AggregateRequests: false
        },
        I18n: {
            enabled: false
        }
    }
};