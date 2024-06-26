import axios from 'axios';
import fsp from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import * as cheerio from 'cheerio';

// const pathName = '/Users/ekaterinamavlutova/Desktop/sourcemaking-com';
// const pathExt = path.parse(pathName).ext;
// console.log(pathExt.ext === '');
// console.log(pathName.replace('.html', ''));

const getHTML = async (url) => {
  const response = await axios.get(url);
  const pageHTML = response.data;
  return pageHTML;
};

const saveAsHtml = async (pathToFile, htmlData) => {
  await fsp.writeFile(pathToFile, htmlData, 'utf-8');
};

const makeNameFromUrl = (someUrl, additionalText = '') => {
  const myUrl = new URL(someUrl);
  const urlProtocol = myUrl.protocol;
  const urlWithoutProtocol = someUrl
    .replace(`${urlProtocol}//`, '')
    .replaceAll(/\W/g, '-');
  return `${urlWithoutProtocol}${additionalText}`;
};

const tagAttr = {
  img: 'src',
  link: 'href',
  script: 'src',
};

const getLocalSrces = (domObj, url) => Object.entries(tagAttr).reduce((acc, [tag, attr]) => {
  domObj(tag)
    .filter((i, element) => {
      const hasAttr = domObj(element).attr(attr);
      const elementLink = domObj(element).attr(attr);
      const elementUrl = new URL(elementLink, url.origin);
      const isSameHostName = url.hostname === elementUrl.hostname;
      return hasAttr && isSameHostName;
    })
    .each((i, element) => acc.push(domObj(element)));

  return acc;
}, []);

const getAbsoluteUrls = (domObj, domElements, url) => domElements.map((element) => {
  const attr = tagAttr[domObj(element).get(0).tagName];
  const absoluteUrl = new URL(domObj(element).attr(attr), url.origin);
  return absoluteUrl.href;
});

const downloadAsset = async (dirname, url, filename) => {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const fullPath = path.join(dirname, filename);
  await fsp.writeFile(fullPath, response.data);
  // return fullPath; // нужно ли что-то возвращать?
};

const pageLoader = async (link, saveToDir = process.cwd()) => {
  const mainUrl = new URL(link); // URL из ссылки в строке
  const html = await getHTML(mainUrl); // html страницы
  const $ = cheerio.load(html); // объект cheerio (DOM)
  const $localSrces = getLocalSrces($, mainUrl); // элементы cheerio
  const dirForFilesName = makeNameFromUrl(link, '_files');
  const pathToFiles = path.join(saveToDir, dirForFilesName); // директория для локальных ресурсов
  await fsp.mkdir(pathToFiles, { recursive: true });
  const localSrcesUrls = getAbsoluteUrls($, $localSrces, mainUrl); // абсолютные ссылки
  const localSrcesNames = localSrcesUrls.map((item) => {
    const fileExt = path.parse(item).ext || '.html';
    const fileWithoutExt = item.replace(fileExt, '');
    const hasQueryParams = fileExt.lastIndexOf('?') !== -1;
    const withoutQueryParameters = fileExt.slice(0, hasQueryParams ? fileExt.lastIndexOf('?') : fileExt.length);
    return makeNameFromUrl(fileWithoutExt, withoutQueryParameters);
  }); // массив имен файлов
  await Promise.allSettled(localSrcesUrls.map((item, index) => downloadAsset(
    pathToFiles,
    item,
    localSrcesNames[index],
  ))); // скачиваем ссылки в указанную директорию
  const newLinksToLocalSrces = localSrcesNames.map((item) => path.join(dirForFilesName, item));
  $localSrces.forEach((element, i) => {
    const attr = tagAttr[$(element).get(0).tagName];
    $(element).attr(attr, newLinksToLocalSrces[i]);
  });
  const htmlFilename = makeNameFromUrl(link, '.html');
  const htmlFilePath = path.join(saveToDir, htmlFilename);
  saveAsHtml(htmlFilePath, $.html());

  return { filepath: htmlFilePath };
};

// console.log(await pageLoader('https://sourcemaking.com', '/Users/ekaterinamavlutova/Desktop/test'));

export default pageLoader;
