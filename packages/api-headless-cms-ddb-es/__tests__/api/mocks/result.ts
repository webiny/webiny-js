export const createExpectedGetResult = () => {
    return {
        values: {
            title: "Title level 0",
            age: 123,
            isMarried: true,
            dateOfBirth: "2020-01-01",
            description: {
                compression: "gzip",
                value: expect.any(String)
            },
            body: {
                compression: "jsonpack",
                value: expect.any(String)
            },
            information: {
                subtitle: "Title level 1",
                subAge: 234,
                subIsMarried: false,
                subDateOfBirth: "2020-01-02",
                subDescription: {
                    compression: "gzip",
                    value: expect.any(String)
                },
                subBody: {
                    compression: "jsonpack",
                    value: expect.any(String)
                },
                subInformation: {
                    subSecondSubtitle: "Title level 2",
                    subSecondSubAge: 345,
                    subSecondSubIsMarried: false,
                    subSecondSubDateOfBirth: "2020-01-03",
                    subSecondSubDescription: {
                        compression: "gzip",
                        value: expect.any(String)
                    },
                    subSecondSubBody: {
                        compression: "jsonpack",
                        value: expect.any(String)
                    }
                }
            }
        }
    };
};
