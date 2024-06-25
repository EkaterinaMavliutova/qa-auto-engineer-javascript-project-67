import nock from 'nock';
// import fsp from 'node:fs/promises';
import path from 'node:path';
// import os from 'node:os';
import pageLoader from '../src/pageLoader.js';
import { readTestFile, makeTempDir, removeTempDirs } from './utils.js';

nock.disableNetConnect();

let tempDir = '';

beforeEach(async () => {
  try {
    await removeTempDirs('page-loader-');
    tempDir = await makeTempDir('page-loader-');
  } catch (err) {
    throw new Error(err);
  }
});
test('pageLoader returns file path according to passed arguments', async () => {
  // const link = new URL('https://ru.hexlet.io/courses');
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, await readTestFile('expected.html'));
  const result = await pageLoader('https://ru.hexlet.io/courses', tempDir);
  // console.log(await fsp.readFile(path.join(tempDir, 'ru-hexlet-io-courses.html'), 'utf8'));
  console.log(`tempDir: ${tempDir}`);
  expect(result).toEqual({
    filepath: path.join(tempDir, 'ru-hexlet-io-courses.html'),
  });
});
