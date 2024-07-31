import axios, { isAxiosError } from 'axios';
import fsp from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import * as cheerio from 'cheerio';
import debug from 'debug';

const log = debug('page-loader');

const tagAttrMap = {
  img: 'src',
  link: 'href',
  script: 'src',
};

const getHTML = async (url) => {
  try {
    const response = await axios.get(url);
    const pageHTML = response.data;
    return pageHTML;
  } catch (err) {
    throw new Error(`Oops, an error occurred connecting to '${url}'! Details: ${err.message}`);
  }
};

const saveAsHtml = async (pathToFile, htmlData) => {
  try {
    await fsp.writeFile(pathToFile, htmlData, 'utf-8');
  } catch (err) {
    throw new Error(`Unable to create '${pathToFile}'. Details: ${err.message}`);
  }
};

const makeNameFromUrl = (someUrl, additionalText = '') => {
  const myUrl = new URL(someUrl);
  const urlProtocol = myUrl.protocol;
  const urlWithoutProtocol = someUrl
    .replace(`${urlProtocol}//`, '')
    .replaceAll(/\W/g, '-');
  return `${urlWithoutProtocol}${additionalText}`;
};

const getLocalAssets = (domObj, url) => Object.entries(tagAttrMap).reduce((acc, [tag, attr]) => {
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
  const attr = tagAttrMap[domObj(element).get(0).tagName];
  const absoluteUrl = new URL(domObj(element).attr(attr), url.origin);
  return absoluteUrl.href;
});

const downloadAsset = async (dirName, url, fileName) => {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const fullPath = path.join(dirName, fileName);
    await fsp.writeFile(fullPath, response.data);
  } catch (err) {
    if (isAxiosError(err)) {
      throw new Error(`Unable to download local asset '${fileName}'. Details: ${err.message}`);
    }
    throw new Error(`Unable to save ${fileName}. Details: ${err.message}`);
  }
};

const replaceLinks = (domObj, domElements, newLinks) => {
  domElements.forEach((element, i) => {
    const attr = tagAttrMap[domObj(element).get(0).tagName];
    domObj(element).attr(attr, newLinks[i]);
  });
};

const pageLoader = async (link, saveToDir = process.cwd()) => {
  log('pageLoader is now running!');
  if (!link) {
    throw new Error('Empty or incorrect URL');
  }
  try {
    await fsp.access(saveToDir, fsp.constants.F_OK);
  } catch (err) {
    throw new Error(`Directory passed for downloading ${saveToDir} is not exist. Details: ${err}`); // err.message
  }
  let mainUrl = '';
  try {
    mainUrl = new URL(link); // URL из ссылки в строке
  } catch (err) {
    throw new Error(`Empty or incorrect URL% ${link}`);
  }
  const html = await getHTML(mainUrl); // html страницы
  const $ = cheerio.load(html); // объект cheerio (DOM)
  const $localAssets = getLocalAssets($, mainUrl); // элементы cheerio
  const dirForAssetsName = makeNameFromUrl(link, '_files');
  const pathToAssets = path.join(saveToDir, dirForAssetsName); // директория для локальных ресурсов
  try {
    await fsp.access(saveToDir, fsp.constants.W_OK);
  } catch (err) {
    throw new Error(`Unable to create '${pathToAssets}', access denied`);
  }
  await fsp.mkdir(pathToAssets, { recursive: true });
  const localAssetsUrls = getAbsoluteUrls($, $localAssets, mainUrl); // абсолютные ссылки
  const localAssetsNames = localAssetsUrls.map((item) => {
    const fileExt = path.parse(item).ext || '.html';
    const fileWithoutExt = item.replace(fileExt, '');
    const hasQueryParams = fileExt.lastIndexOf('?') !== -1;
    const withoutQueryParameters = fileExt.slice(0, hasQueryParams ? fileExt.lastIndexOf('?') : fileExt.length);
    return makeNameFromUrl(fileWithoutExt, withoutQueryParameters);
  }); // массив имен файлов
  await Promise.all(localAssetsUrls.map((item, index) => downloadAsset(
    pathToAssets,
    item,
    localAssetsNames[index],
  ))); // скачиваем ссылки в указанную директорию
  const newLinksToLocalAssets = localAssetsNames.map((item) => path.join(dirForAssetsName, item));
  replaceLinks($, $localAssets, newLinksToLocalAssets);
  const htmlFileName = makeNameFromUrl(link, '.html');
  const htmlFilePath = path.join(saveToDir, htmlFileName);
  await saveAsHtml(htmlFilePath, $.html());

  return { filepath: htmlFilePath };
};

export default pageLoader;
