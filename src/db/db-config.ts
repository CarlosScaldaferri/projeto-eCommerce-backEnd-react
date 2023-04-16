import { knexFile } from "./knexFile";

import { knex } from "knex";

export const db = knex(knexFile);
