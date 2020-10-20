import { Listr } from "listr2";
export interface Context {
    status?: boolean;
}
export interface Template {
    type: string;
    name: string;
    scripts: Record<string, Listr>;
}
