import nock from 'nock';
import fsp from 'node:fs/promises';
import path from 'node:path';
import pageLoader from '../src/pageLoader.js';
import {
  readTestFile, makeTempDir, removeTempDirs,
  getFixturePath,
} from './utils.js';

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
});

describe('pageLoader (positive scenarios)', () => {
  beforeEach(async () => {
    const fixtureFiles = await Promise.all(
      nockedRequests.map(({ fixtureName }) => readTestFile(fixtureName)),
    );
    const scope = nock('https://ru.hexlet.io');
    nockedRequests.forEach(({ route }, index) => {
      scope
        .get(route)
        .reply(200, fixtureFiles[index]);
    });
  });
  test('returns file path according to passed arguments', async () => {
    expect.assertions(1);

    const result = await pageLoader('https://ru.hexlet.io/courses', tempDir);

    expect(result).toEqual({
      filepath: path.join(tempDir, 'ru-hexlet-io-courses.html'),
    });
  });

  test('not throws when valid arguments are passed', async () => {
    expect.assertions(1);

    await expect(pageLoader('https://ru.hexlet.io/courses', tempDir))
      .resolves.not.toThrow();
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
});

describe('pageLoader (negative scenarios)', () => {
  test.each([
    100,
    300,
    400,
    500,
  ])('throws when connecting to web page gets response code except for 2**: whith %d', async (responseCode) => {
    expect.assertions(1);
    nock('https://ru.hexlet.io')
      .get('/courses')
      .reply(responseCode);

    await expect(pageLoader('https://ru.hexlet.io/courses', tempDir))
      .rejects.toThrow(/Oops, an error occurred connecting to/);
  });

  test('throws when failing to download local asset', async () => {
    expect.assertions(1);
    nock('https://ru.hexlet.io')
      .get('/courses')
      .reply(200, await readTestFile('ru-hexlet-io-courses.html'))
      .get('/assets/application.css')
      .reply(500);

    await expect(pageLoader('https://ru.hexlet.io/courses', tempDir))
      .rejects.toThrow(/Unable to download local asset/);
  });

  test('throws when passed path for downloading is not a directory', async () => {
    expect.assertions(1);
    nock('https://ru.hexlet.io')
      .get('/courses')
      .reply(200, await readTestFile('ru-hexlet-io-courses.html'));

    const pathThatIsNotDir = getFixturePath('ru-hexlet-io-courses.html');

    await expect(pageLoader('https://ru.hexlet.io/courses', pathThatIsNotDir))
      .rejects.toThrow(/ENOTDIR/);
  });

  test('throws when nonexistent directory is passed', async () => {
    expect.assertions(1);
    nock('https://ru.hexlet.io')
      .get('/courses')
      .reply(200, await readTestFile('ru-hexlet-io-courses.html'));
    const fakePath = path.join(tempDir, 'fakePath');

    await expect(pageLoader('https://ru.hexlet.io/courses', fakePath))
      .rejects.toThrow(/ENOENT/);
  });

  test('throws when URL argument is not passed', async () => {
    expect.assertions(1);

    await expect(pageLoader(tempDir))
      .rejects.toThrow(/Empty or incorrect URL/);
  });
});

afterAll(() => {
  nock.cleanAll();
  nock.enableNetConnect();
});
