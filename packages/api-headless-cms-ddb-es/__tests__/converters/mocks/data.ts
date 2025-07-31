import { compress } from "~tests/mocks/compressor";

export const bodies = {
    body: [
        {
            tag: "p",
            content: "Content level 0"
        }
    ],
    subBody: [
        {
            tag: "p1",
            content: "Content level 1"
        }
    ],
    subSecondSubBody: [
        {
            tag: "p2",
            content: "Content level 2"
        }
    ]
};

export const createEntryRawData = () => {
    return {
        title: "Title level 0",
        age: 123,
        isMarried: true,
        dateOfBirth: "2020-01-01",
        description: "Description level 0",
        body: bodies.body,
        information: {
            subtitle: "Title level 1",
            subAge: 234,
            subIsMarried: false,
            subDateOfBirth: "2020-01-02",
            subDescription: "Description level 1",
            subBody: bodies.subBody,
            subInformation: {
                subSecondSubtitle: "Title level 2",
                subSecondSubAge: 345,
                subSecondSubIsMarried: false,
                subSecondSubDateOfBirth: "2020-01-03",
                subSecondSubDescription: "Description level 2",
                subSecondSubBody: bodies.subSecondSubBody
            }
        }
    };
};

export const createEntryExpectedTransformedDatesData = () => {
    const raw = createEntryRawData();
    return {
        ...raw,
        dateOfBirth: new Date(raw.dateOfBirth).toISOString(),
        information: {
            ...raw.information,
            subDateOfBirth: new Date(raw.information.subDateOfBirth).toISOString(),
            subInformation: {
                ...raw.information.subInformation,
                subSecondSubDateOfBirth: new Date(
                    raw.information.subInformation.subSecondSubDateOfBirth
                ).toISOString()
            }
        }
    };
};

export const createElasticsearchEntryConvertedData = async () => {
    return {
        values: {
            "text@titleFieldIdWithSomeValue": "Title level 0",
            "number@ageFieldIdWithSomeValue": 123,
            "boolean@isMarriedFieldIdWithSomeValue": true,
            "datetime@dateOfBirthFieldIdWithSomeValue": "2020-01-01",
            "long-text@descriptionFieldIdWithSomeValue": "Description level 0",
            "object@informationFieldIdWithSomeValue": {
                "text@subtitleFieldIdWithSomeValue": "Title level 1",
                "number@subAgeFieldIdWithSomeValue": 234,
                "boolean@subIsMarriedFieldIdWithSomeValue": false,
                "datetime@subDateOfBirthFieldIdWithSomeValue": "2020-01-02",
                "long-text@subDescriptionFieldIdWithSomeValue": "Description level 1",
                "object@subInformationFieldIdWithSomeValue": {
                    "text@subSecondSubtitleFieldIdWithSomeValue": "Title level 2",
                    "number@subSecondSubAgeFieldIdWithSomeValue": 345,
                    "boolean@subSecondSubIsMarriedFieldIdWithSomeValue": false,
                    "datetime@subSecondSubDateOfBirthFieldIdWithSomeValue": "2020-01-03",
                    "long-text@subSecondSubDescriptionFieldIdWithSomeValue": "Description level 2"
                }
            }
        },
        rawValues: {
            "rich-text@bodyFieldIdWithSomeValue": {
                compression: "gzip",
                value: await compress(bodies.body)
            },
            "object@informationFieldIdWithSomeValue": {
                "rich-text@subBodyFieldIdWithSomeValue": {
                    compression: "gzip",
                    value: await compress(bodies.subBody)
                },
                "object@subInformationFieldIdWithSomeValue": {
                    "rich-text@subSecondSubBodyFieldIdWithSomeValue": {
                        compression: "gzip",
                        value: await compress(bodies.subSecondSubBody)
                    }
                }
            }
        }
    };
};
