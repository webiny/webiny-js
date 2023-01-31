exports.handler = async() => {
    // Load the AWS SDK for Node.js
    var AWS = require('aws-sdk');
// Set the region 
    AWS.config.update({region: 'eu-central-1'});

// Create DynamoDB document client
    var docClient = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});

    var params = {
        TableName: 'wby-webiny-345a2c3',
        Key: {'PK': 'asd', SK: 'ss'}
    };

    const res = await docClient.get(params).promise();
    console.log(res)
}