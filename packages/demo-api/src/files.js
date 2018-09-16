// @flow
import uploadFile from "./files/uploadFile";

export default async (event: Object) => {
    event.body = event.body ? JSON.parse(event.body) : {};
    const body = await uploadFile(event.body);

    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify(body, null, 2)
    };
};
