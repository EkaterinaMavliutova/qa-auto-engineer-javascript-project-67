import { promises as fsp } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import nock from 'nock';
import pageLoader from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildFixturesPath = (...paths) => path.join(__dirname, '..', '__fixtures__', ...paths);
const readFile = (dirpath, filename) => fsp.readFile(path.join(dirpath, filename), 'utf-8');

const pageDirname = 'ru-hexlet-io-courses_files';
const pageFilename = 'ru-hexlet-io-courses.html';
const baseUrl = 'https://ru.hexlet.io';
const pagePath = '/courses';
const pageUrl = new URL(pagePath, baseUrl);

let expectedPageContent = '';
let resources = [
  {
    format: 'css',
    urlPath: '/assets/application.css',
    filename: path.join(
      pageDirname,
      'ru-hexlet-io-assets-application.css',
    ),
  },
  {
    format: 'png',
    urlPath: '/assets/professions/nodejs.png',
    filename: path.join(
      pageDirname,
      'ru-hexlet-io-assets-professions-nodejs.png',
    ),
  },
  {
    format: 'js',
    urlPath: '/packs/js/runtime.js',
    filename: path.join(
      pageDirname,
      'ru-hexlet-io-packs-js-runtime.js',
    ),
  },
  {
    format: 'html',
    urlPath: '/courses',
    filename: path.join(
      pageDirname,
      'ru-hexlet-io-courses.html',
    ),
  },
];

const formats = resources.map(({ format }) => format);
const scope = nock(baseUrl).persist();

// Важно отрубить реальные коннекты
nock.disableNetConnect();

beforeAll(async () => {
  const sourcePageContent = await readFile(buildFixturesPath('.'), pageFilename);
  const promises = resources.map((info) => readFile(buildFixturesPath('.'), info.filename)
    .then((data) => ({ ...info, data })));

  expectedPageContent = await readFile(buildFixturesPath('.'), 'expected.html' /* pageFilename */);
  resources = await Promise.all(promises);

  scope.get(pagePath).reply(200, sourcePageContent);
  resources.forEach(({ urlPath, data }) => scope.get(urlPath).reply(200, data));
});

describe('negative cases', () => {
  let tmpDirPath = '';
  beforeEach(async () => {
    // На каждый тест своя временная директория (это изоляция!)
    // Чистить не надо, система сама почистит
    tmpDirPath = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  });

  // проверка ошибок сети
  test('load page: no response', async () => {
    await expect(fsp.access(path.join(tmpDirPath, pageFilename)))
      .rejects.toThrow(/ENOENT/);

    const invalidBaseUrl = 'https://badsite.com';
    const expectedError = `getaddrinfo ENOTFOUND ${invalidBaseUrl}`;
    nock(invalidBaseUrl).persist().get('/').replyWithError(expectedError);
    await expect(pageLoader(invalidBaseUrl, tmpDirPath))
      .rejects.toThrow(expectedError);

    await expect(fsp.access(path.join(tmpDirPath, pageFilename)))
      .rejects.toThrow(/ENOENT/);
  });

  // проверка ошибок с сайта
  test.each([404, 500])('load page: status code %s', async (code) => {
    scope.get(`/${code}`).reply(code, '');
    const url = new URL(`/${code}`, baseUrl).toString();
    await expect(pageLoader(url, tmpDirPath))
      .rejects.toThrow(new RegExp(code));
  });

  // проверка ошибок файловой системы
  test('load page: file system errors', async () => {
    const rootDirPath = '/sys';
    await expect(pageLoader(pageUrl.toString(), rootDirPath))
      .rejects.toThrow();

    const filepath = buildFixturesPath(pageFilename);
    await expect(pageLoader(pageUrl.toString(), filepath))
      .rejects.toThrow(/ENOTDIR/);

    await expect(pageLoader(pageUrl.toString(), path.join(tmpDirPath, 'notExistsPath')))
      .rejects.toThrow(/ENOENT/);
  });
});

describe('positive cases', () => {
  let tmpDirPath = '';
  beforeAll(async () => {
    tmpDirPath = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
    await pageLoader(pageUrl.toString(), tmpDirPath);
  });

  // кейс: проверка скачанных файлов
  test('check HTML-page', async () => {
    await expect(fsp.access(path.join(tmpDirPath, pageFilename)))
      .resolves.not.toThrow();

    const actualContent = await readFile(tmpDirPath, pageFilename);
    expect(actualContent).toStrictEqual(expectedPageContent.trim());
  });
  test.each(formats)('check .%s-resource', async (format) => {
    const { filename, data } = resources.find((content) => content.format === format);
    console.log(`fileName: ${filename}`);
    await expect(fsp.access(path.join(tmpDirPath, pageFilename)))
      .resolves.not.toThrow();
    console.log(`tmpDirPath: ${tmpDirPath}`);
    const actualContent = await readFile(tmpDirPath, filename);
    expect(actualContent).toStrictEqual(data);
  });
});
