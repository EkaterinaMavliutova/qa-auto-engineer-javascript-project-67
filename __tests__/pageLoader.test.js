import nock from 'nock';
import fsp from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import pageLoader from '../src/pageLoader.js';
import { readTestFile } from './utils.js';

nock.disableNetConnect();

let tempDir = '';

beforeEach(async () => {
  tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});
test('pageLoader returns expected file path', async () => {
  // const link = new URL('https://ru.hexlet.io/courses');
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, readTestFile('expected.html'));
  const result = await pageLoader('https://ru.hexlet.io/courses', tempDir);
  expect(result).toEqual({
    filepath: path.join(tempDir, 'ru-hexlet-io-courses.html'),
  });
});
