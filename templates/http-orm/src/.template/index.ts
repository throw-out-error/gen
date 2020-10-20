import { Template, Ctx, compileTs } from "@toes/gen";
import path from "path";

import { Listr } from "listr2";
const template: Template = {
    type: "http-orm",
    name: "untitled-project",
    scripts: {
        build: new Listr<Ctx>(
            [
                /* tasks */
                {
                    title: "Compile Typescript",
                    task: async (ctx, task) => {
                        compileTs();
                    },
                },
            ],
            {
                /* options */
            }
        ),
    },
};
export default template;
