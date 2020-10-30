const avatars = {
    userA: {
        id: "1ja9FeDZUtJXapQFHj1eNoHJatrA",
        name: "8kgvqs3io-8kgvqrn7i-John-Rambo-Sylvester-Stallone.jpg",
        key: "8kgvqs3io-8kgvqrn7i-John-Rambo-Sylvester-Stallone.jpg",
        src:
            "//d3ulsgnn9qke57.cloudfront.net/files/8kgvqs3io-8kgvqrn7i-John-Rambo-Sylvester-Stallone.jpg",
        size: 97579,
        type: "image/jpeg"
    },
    userB: {
        id: "1ja9FeDZUtJXapQFHj1eNoHJatrB",
        name: "8kgvqs3io-8kgvqrn7i-John-Rambo-Sylvester-Stallone.jpg",
        key: "8kgvqs3io-8kgvqrn7i-John-Rambo-Sylvester-Stallone.jpg",
        src:
            "//d3ulsgnn9qke57.cloudfront.net/files/8kgvqs3io-8kgvqrn7i-John-Rambo-Sylvester-Stallone.jpg",
        size: 97579,
        type: "image/jpeg"
    },
    admin: {
        id: "1ja9FeDZUtJXapQFHj1eNoHJatrAdmin",
        name: "8kgvqs3io-8kgvqrn7i-John-Rambo-Sylvester-Stallone.jpg",
        key: "8kgvqs3io-8kgvqrn7i-John-Rambo-Sylvester-Stallone.jpg",
        src:
            "//d3ulsgnn9qke57.cloudfront.net/files/8kgvqs3io-8kgvqrn7i-John-Rambo-Sylvester-Stallone.jpg",
        size: 97579,
        type: "image/jpeg"
    }
};

const mocks = {
    userA: {
        email: "user_a@yahoo.com",
        firstName: "Arabella",
        lastName: "Ricci",
        avatar: avatars.userA
    },
    userB: {
        email: "user_b@email.it",
        firstName: "Arturo",
        lastName: "Surace",
        avatar: avatars.userB
    },
    admin: {
        id: "1234567890",
        login: "admin@webiny.com",
        type: "admin",
        firstName: "Admin",
        lastName: "Test",
        avatar: avatars.admin
    },
    adminUser: {
        id: "1234567890",
        email: "admin@webiny.com",
        firstName: "Admin",
        lastName: "Test",
        avatar: avatars.admin
    }
};

export default mocks;
