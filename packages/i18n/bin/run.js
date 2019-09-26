import Extractor from "./../src/extractor";

import { argv } from "yargs";

const args = {
    glob: argv._[0]
};

const extractor = new Extractor();
extractor.setGlob(args.glob).execute();
