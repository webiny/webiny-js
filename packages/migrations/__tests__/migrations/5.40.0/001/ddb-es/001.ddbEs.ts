import { user } from "./001.ddb";

export const createDdbEsFormsData = () => {
    return [
        {
            PK: "T#root#L#en-US#FB#F#65c0a07038a36e00082095ea",
            SK: "L",
            data: {
                createdBy: user,
                createdOn: "2024-02-05T08:46:40.354Z",
                formId: "65c0a07038a36e00082095ea",
                id: "65c0a07038a36e00082095ea#0001",
                locale: "en-US",
                locked: true,
                name: "Demo form 1",
                ownedBy: user,
                published: true,
                publishedOn: "2024-02-05T08:47:01.134Z",
                savedOn: "2024-02-05T08:47:01.134Z",
                slug: "demo-form-1-65c0a07038a36e00082095ea",
                status: "published",
                tenant: "root",
                version: 1,
                webinyVersion: "0.0.0",
                __type: "fb.form"
            },
            index: "root-en-us-form-builder",
            TYPE: "fb.form.latest",
            _ct: "2024-02-05T08:47:01.161Z",
            _et: "FormBuilderFormEs",
            _md: "2024-02-05T08:47:01.161Z"
        }
    ];
};
