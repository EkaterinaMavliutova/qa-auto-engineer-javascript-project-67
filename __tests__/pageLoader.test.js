import nock from 'nock';
// import fsp from 'node:fs/promises';
import fsp from 'node:fs/promises';
import path from 'node:path';
// import os from 'node:os';
import pageLoader from '../src/pageLoader.js';
import {
  readTestFile, makeTempDir, removeTempDirs, getFixturePath,
} from './utils.js';

let tempDir = '';
const nockedRequests = [
  // {
  //   route: '/courses',
  //   fixtureName: 'responseData.html',
  // },
  {
    route: '/assets/application.css',
    fixtureName: 'application.css',
  },
  {
    route: '/assets/professions/nodejs.png',
    fixtureName: 'nodejs.png',
  },
  {
    route: '/courses',
    fixtureName: 'ru-hexlet-io-courses.html',
  },
  {
    route: '/packs/js/runtime.js',
    fixtureName: 'runtime.js',
  },
];

beforeAll(() => nock.disableNetConnect());

beforeEach(async () => {
  try {
    await removeTempDirs('page-loader-');
    tempDir = await makeTempDir('page-loader-');
  } catch (err) {
    throw new Error(err);
  }
  const fixtureFiles = await Promise.all(
    nockedRequests.map(({ fixtureName }) => readTestFile(fixtureName)),
  );
  const scope = nock('https://ru.hexlet.io');
  nockedRequests.forEach(({ route }, index) => {
    scope
      .persist()
      .get(route)
      .reply(200, fixtureFiles[index]);
  });
});

describe('pageLoader: positive tests', () => {
  test('returns file path according to passed arguments', async () => {
  // const link = new URL('https://ru.hexlet.io/courses');
    const result = await pageLoader('https://ru.hexlet.io/courses', tempDir);
    // console.log(await fsp.readFile(path.join(tempDir, 'ru-hexlet-io-courses.html'), 'utf8'));
    // console.log(`tempDir: ${tempDir}`);
    expect(result).toEqual({
      filepath: path.join(tempDir, 'ru-hexlet-io-courses.html'),
    });
    // expect(await readTestFile('nodejs.png'))
    //   .toEqual(await fsp.readFile(
    //  path.join(tempDir, 'ru-hexlet-io-courses_files', 'ru-hexlet-io-assets-professions-nodejs.png'),
    //     'utf-8',
    //   ));
  });

  test('replaces links to local assets after downloading', async () => {
    const result = await pageLoader('https://ru.hexlet.io/courses', tempDir);
    expect(await fsp.readFile(result.filepath, 'utf-8'))
      .toEqual(await readTestFile('expected.html'));
  });

  test.each([
    {
      downloadedLocalAsset: 'ru-hexlet-io-assets-application.css',
      expectedFile: 'application.css',
    },
    {
      downloadedLocalAsset: 'ru-hexlet-io-assets-professions-nodejs.png',
      expectedFile: 'nodejs.png',
    },
    {
      downloadedLocalAsset: 'ru-hexlet-io-courses.html',
      expectedFile: 'ru-hexlet-io-courses.html',
    },
    {
      downloadedLocalAsset: 'ru-hexlet-io-packs-js-runtime.js',
      expectedFile: 'runtime.js',
    },
  ])(
    'downloads local asset $expectedFile to the directory with \'_files\' suffix',
    async ({ downloadedLocalAsset, expectedFile }) => {
      const result = await pageLoader('https://ru.hexlet.io/courses', tempDir);
      const expectedLocalAssetsPath = result.filepath.replace('.html', '_files');
      const fullPathToLocalAsset = path.join(expectedLocalAssetsPath, downloadedLocalAsset);
      expect(await fsp.readFile(fullPathToLocalAsset, 'utf-8'))
        .toEqual(await readTestFile(expectedFile));
    },
  );

  test('downloads files and page to current working directory if directory is not passed', async () => {
    expect.assertions(2);
    const currentWorkingDir = process.cwd();
    process.chdir(tempDir);
    const result = await pageLoader('https://ru.hexlet.io/courses');
    const expectedFilePath = path.join(process.cwd(), 'ru-hexlet-io-courses.html');
    const expectedAssetsPath = expectedFilePath.replace('.html', '_files');
    const resultAssetsPath = result.filepath.replace('.html', '_files');
    expect(result.filepath).toBe(expectedFilePath);
    expect(resultAssetsPath).toBe(expectedAssetsPath);
    process.chdir(currentWorkingDir);
  });
});

afterAll(() => {
  nock.cleanAll();
  nock.enableNetConnect();
});
