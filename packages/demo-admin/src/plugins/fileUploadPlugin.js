// @flow
import type { WithFileUploadPlugin } from "webiny-app/types";
import type { SelectedFile } from "react-butterfiles";

const fileUploadPlugin: WithFileUploadPlugin = {
    type: "with-file-upload",
    name: "with-file-upload",
    upload: async (file: SelectedFile, config: { uri: string, s3: boolean }) => {
       /* if (!config.webinyCloud) {
            return new Promise(resolve => {
                const xhr = new window.XMLHttpRequest(); // eslint-disable-line
                xhr.open("POST", "/files", true);
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.send(JSON.stringify(file));
                xhr.onload = function() {
                    resolve(JSON.parse(this.responseText));
                };
            });
        }*/

        const presignedPostPayload = await new Promise(resolve => {
            const xhr = new window.XMLHttpRequest(); // eslint-disable-line
            xhr.open("POST", "https://academy.z1.webiny.com/files", true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(JSON.stringify({ name: file.name }));
            xhr.onload = function() {
                resolve(JSON.parse(this.responseText));
            };
        });

        const s3Upload = await new Promise(resolve => {
            const formData = new window.FormData();
            Object.keys(presignedPostPayload.data.fields).forEach(key => {
                formData.append(key, presignedPostPayload.data.fields[key]);
            });
            formData.append("file", window.fajler);

            const xhr = new window.XMLHttpRequest(); // eslint-disable-line
            xhr.open("POST", presignedPostPayload.data.url, true);
            xhr.send(formData);
            xhr.onload = function() {
                resolve(this.responseText);
            };
        });

        console.log('asad' , s3Upload)

    }
};

export default fileUploadPlugin;
/*

window.baja = {
    code: "FILE_UPLOAD_SUCCESS",
    data: {
        url: "https://s3.us-east-2.amazonaws.com/webiny-cloud-z1",
        fields: {
            key: "/uploads/5c3f6aeac6e47b2c71ca055f/1jrj7tbxa_lambdaLogo.png",
            bucket: "webiny-cloud-z1",
            "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
            "X-Amz-Credential": "ASIAZGPYLXOC7OUAGTPR/20190130/us-east-2/s3/aws4_request",
            "X-Amz-Date": "20190130T131704Z",
            "X-Amz-Security-Token":
                "FQoGZXIvYXdzECwaDAB/027nC5v+Vy0FTCLyAeoOayEXNPh0YL4JUDV1GNVDa2ab89Ay1jE0d4UBYJLW6rSVgFF0+1dchj1UaVHAia+YINu7QeHGzla5XSWGU89JCLjTkNXyxXPGYeSPYWWw5wju8FwdjsprRZz3hDP8wav8SMnV9GzA+rGudUS7rcgztErA5CJh5J5WO9a2Jy4Cy22oIYP9CI4a2K/JpLgxl07iF6Or8TwN0yGw/nU5tW6BS5jZvQwR+LHk8prPyt4x6fZPjyQ7x9XP9MTwPPK8I52Km6NCihSTKemWnkYd/871s/mXtz03TMJkxz4Icbteu7Om2Jw1ofJ6/6vR3/OdLwcpKN6FxuIF",
            Policy:
                "eyJleHBpcmF0aW9uIjoiMjAxOS0wMS0zMFQxNDoxNzowNFoiLCJjb25kaXRpb25zIjpbeyJrZXkiOiIvdXBsb2Fkcy81YzNmNmFlYWM2ZTQ3YjJjNzFjYTA1NWYvMWpyajd0YnhhX2xhbWJkYUxvZ28ucG5nIn0seyJidWNrZXQiOiJ3ZWJpbnktY2xvdWQtejEifSx7IlgtQW16LUFsZ29yaXRobSI6IkFXUzQtSE1BQy1TSEEyNTYifSx7IlgtQW16LUNyZWRlbnRpYWwiOiJBU0lBWkdQWUxYT0M3T1VBR1RQUi8yMDE5MDEzMC91cy1lYXN0LTIvczMvYXdzNF9yZXF1ZXN0In0seyJYLUFtei1EYXRlIjoiMjAxOTAxMzBUMTMxNzA0WiJ9LHsiWC1BbXotU2VjdXJpdHktVG9rZW4iOiJGUW9HWlhJdllYZHpFQ3dhREFCLzAyN25DNXYrVnkwRlRDTHlBZW9PYXlFWE5QaDBZTDRKVURWMUdOVkRhMmFiODlBeTFqRTBkNFVCWUpMVzZyU1ZnRkYwKzFkY2hqMVVhVkhBaWErWUlOdTdRZUhHemxhNVhTV0dVODlKQ0xqVGtOWHl4WFBHWWVTUFlXV3c1d2p1OEZ3ZGpzcHJSWnozaERQOHdhdjhTTW5WOUd6QStyR3VkVVM3cmNnenRFckE1Q0poNUo1V085YTJKeTRDeTIyb0lZUDlDSTRhMksvSnBMZ3hsMDdpRjZPcjhUd04weUd3L25VNXRXNkJTNWpadlF3UitMSGs4cHJQeXQ0eDZmWlBqeVE3eDlYUDlNVHdQUEs4STUyS202TkNpaFNUS2VtV25rWWQvODcxcy9tWHR6MDNUTUpreHo0SWNidGV1N09tMkp3MW9mSjYvNnZSMy9PZEx3Y3BLTjZGeHVJRiJ9XX0=",
            "X-Amz-Signature": "ccc5932943c317b600f4ecbdae34d85e4031c9cec4964e8ff7a732d6c91dfdd8"
        }
    }
};

window.formData = new FormData();
Object.keys(baja.data.fields).forEach(key => {
    window.formData.append(key, window.baja.data.fields[key]);
});
window.formData.append("file", window.fajla);

window.REQUESTER = new XMLHttpRequest();
REQUESTER.open("POST", window.baja.data.url, false);
REQUESTER.send(window.formData);
console.log(REQUESTER.response);
*/
