// import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { __dirname } from '../eslint.config';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

export const getFixturePath = (fileName) => path.join(__dirname, '..', '__fixtures__', fileName);
export const readTestFile = (fileName) => fs.readFileSync(getFixturePath(fileName), 'utf-8');
