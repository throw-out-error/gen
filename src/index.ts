#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import * as chalk from "chalk";
import { prompt } from "enquirer";
import * as cp from "child_process";
import { Listr } from "listr2";
import { Command } from "commander";
import { Ctx, ProjectOptions } from "./ctx";
import { Template } from "./template";

const CURR_DIR = process.cwd();

let tasks: Listr;

const SKIP_FILES = ["node_modules"];

function createDirContents(
    templatePath: string,
    projectName: string,
    ogProjectName: string
) {
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

            // console.log(origFilePath);

            if (origFilePath.endsWith(path.join(".template", "index.ts")))
                contents = contents.replace(
                    `name: "untitled-project"`,
                    `name: "${ogProjectName}"`
                );

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
                path.join(projectName, file),
                ogProjectName
            );
        }
    });
}

export async function main(): Promise<void> {
    const program = new Command();
    program.version("1.0.0");

    const ctx: Ctx = {};
    program
        .command("create")
        .description("create a project")
        .action(async () => {
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
                            createDirContents(
                                templatePath,
                                projectName,
                                projectName
                            );
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

            if (tasks) await tasks.run(ctx);
        });
    program
        .command("run <script> [args]")
        .description("run a script from your project")
        .action(async (script, args) => {
            const template: Template | undefined = (
                await import(
                    path.join(CURR_DIR, "src", ".template", "index.ts")
                )
            ).default;
            if (!template)
                throw new Error(
                    "This project does not have a .template folder"
                );
            const tasks = template.scripts[script];
            if (!tasks) throw new Error(`Invalid script ${script}`);
            const templatePath: string = path.join(
                __dirname,
                "..",
                "templates",
                template.type
            );
            ctx.currentProject = {
                projectName: path.basename(CURR_DIR),
                targetPath: CURR_DIR,
                templateName: template.type,
                templatePath,
            };
            if (tasks) await tasks.run(ctx);
        });
    program.parse(process.argv);
}

export * from "./template";
export * from "./ctx";
export * from "./scripts";
