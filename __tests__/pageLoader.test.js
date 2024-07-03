import nock from 'nock';
import fsp from 'node:fs/promises';
import path from 'node:path';
import pageLoader from '../src/pageLoader.js';
import {
  readTestFile, makeTempDir, removeTempDirs,
} from './utils.js';
import { read } from 'node:fs';

let tempDir = '';
const nockedRequests = [
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
  // const fixtureFiles = await Promise.all(
  //   nockedRequests.map(({ fixtureName }) => readTestFile(fixtureName)),
  // );
  // const scope = nock('https://ru.hexlet.io');
  // nockedRequests.forEach(({ route }, index) => {
  //   scope
  //     .persist()
  //     .get(route)
  //     .reply(200, fixtureFiles[index]);
  // });
});

describe('pageLoader (positive scenarios)', () => {
  beforeEach(async () => {
    const fixtureFiles = await Promise.all(
      nockedRequests.map(({ fixtureName }) => readTestFile(fixtureName)),
    );
    const scope = nock('https://ru.hexlet.io');
    nockedRequests.forEach(({ route }, index) => {
      scope
        // .persist()
        .get(route)
        .reply(200, fixtureFiles[index]);
    });
  });
  test('returns file path according to passed arguments', async () => {
    const result = await pageLoader('https://ru.hexlet.io/courses', tempDir);
    expect(result).toEqual({
      filepath: path.join(tempDir, 'ru-hexlet-io-courses.html'),
    });
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

describe('pageLoader (negative scenarios)', () => {
  // beforeEach(async () => {
  //   const fixtureFiles = await Promise.all(
  //     nockedRequests.map(({ fixtureName }) => readTestFile(fixtureName)),
  //   );
  //   const scope = nock('https://ru.hexlet.io');
  //   nockedRequests.forEach(({ route }, index) => {
  //     scope
  //       // .persist()
  //       .get(route)
  //       .reply(400, fixtureFiles[index]);
  //   });
  // });
  test.each([
    100,
    300,
    400,
    500,
  ])('trows when connecting to web page gets response code except for 2**: whith %d', async (responseCode) => {
    expect.assertions(1);

    nock('https://ru.hexlet.io')
      .get('/courses')
      .reply(responseCode);

    await expect(pageLoader('https://ru.hexlet.io/courses', tempDir))
      .rejects.toThrow();
  });

  test('trows when nonexistent directory is passed', async () => {
    expect.assertions(1);

    nock('https://ru.hexlet.io')
      .get('/courses')
      .reply(200, await readTestFile('ru-hexlet-io-courses.html'));
    const fakePath = path.join(tempDir, 'fakePath');

    await expect(pageLoader('https://ru.hexlet.io/courses', fakePath))
      .rejects.toThrow(`Directory passed for downloading ${fakePath} is not exist`);
  });

  test('trows when there is no write permissions for the directory', async () => {
    expect.assertions(1);

    nock('https://ru.hexlet.io')
      .get('/courses')
      .reply(200, await readTestFile('ru-hexlet-io-courses.html'));
    fsp.chmod(tempDir, 0o555);

    await expect(pageLoader('https://ru.hexlet.io/courses', tempDir))
      .rejects.toBeInstanceOf(Error);
  });
});

afterAll(() => {
  nock.cleanAll();
  nock.enableNetConnect();
});
