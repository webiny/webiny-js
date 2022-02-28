const util = require("util");
const gql = require("graphql-tag");

const schema = /* GraphQL */ `
    type Article {
        title: String
        book: Book
        author: Author
    }
    
    type Book {
        title: String
    }

    type Author {

    }
`;

try {
    gql(schema);
} catch (err) {
    // console.log(util.inspect(err, true, Infinity, true));
    const sdl = err.source.body;
    console.log("Invalid model SDL", sdl);
    console.log(err.locations);

    let gqlType;
    const sdlLines = sdl.split("\n");
    const { line } = err.locations[0];
    for (let i = line; i > 0; i--) {
        if (gqlType && gqlType.includes("type ")) {
            gqlType = gqlType.match(/type\s+(.*?)\s+{/);
            break;
        }

        gqlType = sdlLines[i];
    }

    console.log("Invalid type", gqlType[1]);
    const fieldRegex = new RegExp(`([^\\s+].*?):\\s+${gqlType[1]}`);
    console.log("Field name", sdl.match(fieldRegex)[1]);
}
