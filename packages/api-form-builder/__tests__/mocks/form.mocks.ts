export const fields = [
    {
        _id: "AVoKqyAuH",
        type: "text",
        name: "firstName",
        fieldId: "firstName",
        label: "First name",
        helpText: "",
        placeholderText: "",
        options: [],
        validation: [],
        settings: {
            defaultValue: ""
        }
    },
    {
        _id: "QIspyfQRx",
        type: "text",
        name: "lastName",
        fieldId: "lastName",
        label: "Last name",
        helpText: "",
        placeholderText: "",
        options: [],
        validation: [],
        settings: {
            defaultValue: ""
        }
    },
    {
        _id: "fNJag3ZdX",
        type: "text",
        name: "email",
        fieldId: "email",
        label: "Email",
        helpText: "",
        placeholderText: "",
        options: [],
        validation: [
            {
                name: "pattern",
                message: "Please enter a valid e-mail.",
                settings: {
                    preset: "email",
                    regex: null,
                    flags: null
                }
            }
        ],
        settings: {
            defaultValue: ""
        }
    }
];

export const formSubmissionDataA = {
    data: {
        firstName: "Ashutosh",
        lastName: "Bhardwaj",
        email: "batman@yopmail.com"
    },
    meta: {
        ip: "150.129.183.18"
    }
};

export const formSubmissionDataB = {
    data: {
        email: "bruce.wayne@gotham.com",
        firstName: "Bruce",
        lastName: "Wayne"
    },
    meta: {
        ip: "150.129.183.20"
    }
};

export const formSubmissionDataC = {
    data: {
        email: "clark.kent@gotham.com",
        firstName: "Clark",
        lastName: "Kent"
    },
    meta: {
        ip: "150.129.183.30"
    }
};
