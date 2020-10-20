#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import * as chalk from "chalk";
import { prompt } from "enquirer";
import * as cp from "child_process";
import { Listr } from "listr2";

export interface Context {
    status?: boolean;
}

export interface ProjectOptions {
    projectName: string;
    templateName: string;
    templatePath: string;
    targetPath: string;
}

const CURR_DIR = process.cwd();

let tasks: Listr;

const SKIP_FILES = ["node_modules"];

function createDirContents(templatePath: string, projectName: string) {
    // read all files/folders (1 level) from template folder
    const filesToCreate = fs.readdirSync(templatePath);
    // loop each file/folder
    filesToCreate.forEach((file) => {
        const origFilePath = path.join(templatePath, file);

        // get stats about the current file
        const stats = fs.statSync(origFilePath);

        // skip files that should not be copied
        if (SKIP_FILES.indexOf(file) > -1) return;

        if (stats.isFile()) {
            // read file content and transform it using template engine
            let contents = fs.readFileSync(origFilePath, "utf8");
            // Do processing on the files
            // contents = template.render(contents, { projectName });

            // write file to destination folder
            const writePath = path.join(CURR_DIR, projectName, file);
            fs.writeFileSync(writePath, contents, "utf8");
        } else if (stats.isDirectory()) {
            // create folder in destination folder
            fs.mkdirSync(path.join(CURR_DIR, projectName, file));
            // copy files/folder inside current folder recursively
            createDirContents(
                path.join(templatePath, file),
                path.join(projectName, file)
            );
        }
    });
}

async function main() {
    const choices = ["Create A Project", "Run a Script"];
    const ogChoices = [...choices];
    const response = await prompt({
        type: "autocomplete",
        name: "run",
        message: "What would you like to do today?",
        choices,
    });

    interface Ctx extends Context {
        currentProject?: ProjectOptions;
    }

    const ctx: Ctx = {};

    switch (response["run"]) {
        case ogChoices[0]:
            tasks = new Listr(
                [
                    {
                        title: "Create Project",
                        task: async (ctx: Ctx, task) => {
                            const CHOICES = fs.readdirSync(
                                path.join(__dirname, "..", "templates")
                            );
                            const QUESTIONS = [
                                {
                                    name: "template",
                                    type: "autocomplete",
                                    message:
                                        "What template would you like to use?",
                                    choices: CHOICES,
                                },
                                {
                                    name: "name",
                                    type: "input",
                                    message: "Please input a new project name:",
                                },
                            ];

                            const answers = await task.prompt(QUESTIONS);
                            const projectChoice: string = answers["template"];
                            const projectName: string = answers["name"];
                            const templatePath: string = path.join(
                                __dirname,
                                "..",
                                "templates",
                                projectChoice
                            );
                            const targetPath: string = path.join(
                                CURR_DIR,
                                projectName
                            );

                            const options: ProjectOptions = {
                                projectName,
                                templateName: projectChoice,
                                templatePath,
                                targetPath: targetPath,
                            };
                            ctx.currentProject = options;
                        },
                    },
                    {
                        title: "Create Project Folder",
                        task: async (ctx, task) => {
                            const { targetPath } = ctx.currentProject;
                            if (fs.existsSync(targetPath)) {
                                throw new Error(
                                    `Folder ${targetPath} exists. Delete or use another name.`
                                );
                            }
                            fs.mkdirSync(targetPath);

                            task.output =
                                "Succesfully created project folders...";
                        },
                    },
                    {
                        title: "Create Project Files",
                        task: async function createProjectFiles(ctx, task) {
                            const {
                                templatePath,
                                projectName,
                            } = ctx.currentProject;
                            await createDirContents(templatePath, projectName);
                        },
                    },
                    {
                        title: "Install Node Modules",
                        task: async (ctx, task) => {
                            const isNode = fs.existsSync(
                                path.join(
                                    ctx.currentProject.templatePath,
                                    "package.json"
                                )
                            );
                            // TODO: prompt for package manager and save in ~/.config
                            const pm = "pnpm";

                            if (isNode) {
                                const child = cp.spawn(
                                    /^win/.test(process.platform)
                                        ? `${pm}.cmd`
                                        : pm,
                                    ["install"],
                                    {
                                        windowsHide: true,
                                        stdio: "ignore",
                                        cwd: ctx.currentProject.templatePath,
                                    }
                                );
                                const exitCode = await new Promise(
                                    (resolve, reject) => {
                                        child.on("close", resolve);
                                        child.on("error", reject);
                                    }
                                );
                                if (exitCode !== 0)
                                    throw new Error(
                                        `Failed with exit code ${exitCode}`
                                    );
                            }
                        },
                    },
                ],
                { exitOnError: true }
            );
            break;
    }
    if (tasks) await tasks.run(ctx);
}

main().catch((err) => {
    if (err && err.message.trim() !== "") console.error(chalk.red(`${err}`));
    process.exit(1);
});
