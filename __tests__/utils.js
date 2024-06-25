import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fsp from 'node:fs/promises';
import os from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getFixturePath = (fileName) => path.join(__dirname, '..', '__fixtures__', fileName);
export const readTestFile = async (fileName) => fsp.readFile(getFixturePath(fileName), 'utf-8');

export const makeTempDir = async (dirPrefix) => {
  const tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), dirPrefix));
  return tempDir;
};

export const removeTempDirs = async (dirPrefix) => {
  const osTempDir = os.tmpdir();
  const dirContents = await fsp.readdir(osTempDir, { withFileTypes: true });
  const dirsToRemove = dirContents
    .filter((item) => item.isDirectory() && item.name.startsWith(dirPrefix));
  await Promise.allSettled(dirsToRemove.map(({ name }) => fsp.rm(
    path.join(osTempDir, name),
    { recursive: true, force: true },
  )));
  // console.log(dirContents);
  return dirsToRemove;
};

// const tempDir = os.tmpdir();
// const dirContent = await removeTempDirs('page-loader-');
// console.log(dirContent);

const findTempDirs = async (dirPrefix) => {
  const osTempDir = os.tmpdir();
  const dirContents = await fsp.readdir(osTempDir, { withFileTypes: true });
  const tempDirs = dirContents
    .filter((item) => item.isDirectory() && item.name.startsWith(dirPrefix));
  return tempDirs;
};

// console.log(await findTempDirs('page-loader-'));
// console.log(__dirname);
// console.log(getFixturePath('expected.html'));
// console.log(readTestFile('expected.html'));
// console.log(path.join(os.tmpdir(), 'page-loader-'));
// tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
