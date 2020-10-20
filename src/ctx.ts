import { Context } from "./template";

export interface ProjectOptions {
    projectName: string;
    templateName: string;
    templatePath: string;
    targetPath: string;
}

export interface Ctx extends Context {
    currentProject?: ProjectOptions;
}
