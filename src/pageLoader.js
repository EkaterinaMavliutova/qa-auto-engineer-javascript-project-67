import axios from 'axios';
import fsp from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import * as cheerio from 'cheerio';
import { makeTempDir } from '../__tests__/utils.js';

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

// const file = 'https://sourcemaking.com/css/public-packed.min.css?id=635d993e78a33856cd9008aedc251169'
// const ext = path.parse(file).ext;
// console.log(`fileName: ${file}
// ext: ${ext}`);
// const noExt = file.replace(ext, '');
// console.log(`?: ${ext.lastIndexOf('?')}`);
// const withoutQuery = ext.slice(0, (ext.lastIndexOf('?') || fileExt.length + 1));
// console.log(`noExt: ${noExt}
// withoutQuery: ${withoutQuery}`);

const tagAttrMap = [
  {
    tag: 'img',
    attr: 'src',
  },
  {
    tag: 'link',
    attr: 'href',
  },
  {
    tag: 'script',
    attr: 'src',
  },
];

const getLocalSrces = (domObj, url) => {
  return tagAttrMap.reduce((acc, { tag, attr }) => {
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
};

const getLocalSrces2 = (domObj, tag, attr, url) => {
  return domObj(tag)
      .filter((i, element) => {
        const hasAttr = domObj(element).attr(attr);
        const elementLink = domObj(element).attr(attr);
        const elementUrl = new URL(elementLink, url.origin);
        const isSameHostName = url.hostname === elementUrl.hostname;
        return hasAttr && isSameHostName;
      })
      .each((i, element) => domObj(element)).toArray();
};
// const pageHTML = await getHTML('https://sourcemaking.com'); // получаем строку с html
// const $ = cheerio.load(pageHTML); // получаем объект cheerio
// console.log(Array.isArray(getLocalSrces2($, 'img', 'src', new URL('https://sourcemaking.com'))));

const getAbsoluteUrls = (domElements, url) => {
  return domElements.map((element) => {
    const absoluteUrl = new URL(domElements(element).attr(attr), url.origin);
    return absoluteUrl.href;
  });
};

const getAbsoluteUrls2 = (domObj, domElements, attr, url) => {
  return domElements.map((element) => {
    const absoluteUrl = new URL(domObj(element).attr(attr), url.origin);
    return absoluteUrl.href;
  });
};

// const getLocalSrces2 = async (html, url) => {
//   const $1 = cheerio.load(html); // объект cheerio (DOM)
//   const localSrces = tagAttrMap.reduce((acc, { tag, attr }) => {
//     $1(tag)
//       .filter((i, element) => {
//         const hasAttr = $1(element).attr(attr);
//         // console.log($1(element).attr(attr));
//         // return $1(element).attr(attr);
//         const elementLink = $1(element).attr(attr);
//         const elementUrl = new URL(elementLink, url.origin);
//         const isSameHostName = url.hostname === elementUrl.hostname;
//         return hasAttr && isSameHostName;
//       })
//       .each((i, element) => {
//         const absoluteUrl = new URL($1(element).attr(attr), url.origin);
//         acc.push({
//           url: absoluteUrl.href,
//           $elm: $1(element),
//         });
//       });
//     return acc;
//   }, []);
//   return localSrces;
// };

const downloadAsset = async (dirname, url, filename) => {
  // const response = await axios.get(url.toString(), { responseType: 'arraybuffer' });
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const fullPath = path.join(dirname, filename);
  await fsp.writeFile(fullPath, response.data);
  return fullPath; // нужно ли что-то возвращать?
};

const pageLoader2 = async (link, saveToDir = process.cwd()) => {
  const mainUrl = new URL(link); // URL из ссылки в строке
  const html = await getHTML(mainUrl); // html страницы
  const $ = cheerio.load(html); // объект cheerio (DOM)
  const dirForFilesName = makeNameFromUrl(link, '_files');
  const pathToFiles = path.join(saveToDir, dirForFilesName); // директория для локальных ресурсов
  await fsp.mkdir(pathToFiles, { recursive: true });

  for (let i = 0; i < tagAttrMap.length; i += 1) {
    const { tag, attr } = tagAttrMap[i];
  // tagAttrMap.forEach(async ({ tag, attr }) => {
    const localSrces = getLocalSrces2($, tag, attr, mainUrl); // массив элементов cheerio
    const localSrcesUrls = getAbsoluteUrls2($, localSrces, attr, mainUrl); // массив абсолютных ссылок
    const localSrcesNames = localSrcesUrls.map((item) => {
      const fileExt = path.parse(item).ext;
      // console.log(`fileName: ${item}
      //  fileExt: ${fileExt}`);
      const fileWithoutExt = item.replace(fileExt, '');
      const hasQueryParams = fileExt.lastIndexOf('?') !== -1;
      const withoutQueryParameters = fileExt.slice(0, hasQueryParams ? fileExt.lastIndexOf('?') : fileExt.length);
      // console.log(`fileWithoutExt: ${fileWithoutExt}
      //   withoutQueryParameters: ${withoutQueryParameters}`);
      return makeNameFromUrl(fileWithoutExt, withoutQueryParameters);
    }); // массив имен файлов
    const promises = await Promise.allSettled(localSrcesUrls.map((item, index) => downloadAsset(
      pathToFiles,
      item,
      localSrcesNames[index],
    ))); // скачиваем ссылки в указанную директорию
    const linksToDownloadedSrces = localSrcesNames.map((item) => path.join(dirForFilesName, item));
    // console.log(linksToDownloadedSrces);
    localSrces.forEach((element, i) => {
      $(element).attr(attr, linksToDownloadedSrces[i]);
    });
  }  
  // });
  // console.log(await $.html());
  const htmlFilename = makeNameFromUrl(link, '.html');
  const htmlFilePath = path.join(saveToDir, htmlFilename);  
  await saveAsHtml(htmlFilePath, $.html());

  return { filepath: htmlFilePath };
}; 

console.log(await pageLoader2('https://ru.hexlet.io/courses', '/Users/ekaterinamavlutova/Desktop')); // https://sourcemaking.com

const exampleFunction = async (link, saveToDir = process.cwd()) => {
  const mainUrl = new URL(link); // URL из ссылки в строке
  const html = await getHTML(mainUrl); // html страницы
  const $ = cheerio.load(html); // объект cheerio (DOM)
  const $localSrces = getLocalSrces($, mainUrl); // элементы cheerio
  const localSrcesUrls = getAbsoluteUrls($localSrces, mainUrl); // абсолютные ссылки
  // console.log(localSrces);
  const dirForFilesName = makeNameFromUrl(link, '_files');
  const pathToFiles = path.join(saveToDir, dirForFilesName); // директория для локальных ресурсов
  const localSrcesNames = localSrcesUrls.map((item) => {
    const fileExtenshion = path.parse(item).ext; // расширение файла
    const fileWithoutExt = item.replace(fileExtenshion, '');
    return makeNameFromUrl(fileWithoutExt, fileExtenshion);
  }); // массив имен файлов
  const promises = await Promise.allSettled(localSrcesUrls.map((item, index) => downloadAsset(
    pathToFiles,
    item,
    localSrcesNames[index],
  ))); // скачиваем ссылки в указанную директорию
  const newLinksToLocalSrces = localSrcesNames.map((item) => path.join(dirForFilesName, item));
  $localSrces.forEach((element, i) => {
    $(element).attr('src', newLinksToLocalSrces[i]);
  });
  const htmlFilename = makeNameFromUrl(link, '.html');
  const htmlFilePath = path.join(saveToDir, htmlFilename);  
  saveAsHtml(htmlFilePath, $.html());

  return { filepath: htmlFilePath };
};

exampleFunction('https://sourcemaking.com', '/Users/ekaterinamavlutova/Desktop');





const makeFileNameFromUrl = (someUrl) => {
  const myUrl = new URL(someUrl);
  const urlProtocol = myUrl.protocol;
  const urlWithoutProtocol = someUrl
    .replace(`${urlProtocol}//`, '')
    .replaceAll(/\W/g, '-');
  return `${urlWithoutProtocol}.html`;
};

const getHTML = async (url) => {
  const response = await axios.get(url);
  const pageHTML = response.data;
  return pageHTML;
};

const saveAsHtml = async (pathToFile, htmlData) => {
  await fsp.writeFile(pathToFile, htmlData, 'utf-8');
};

const pageLoader = async (link, saveToDir = process.cwd()) => {
  const htmlContent = await getHTML(link);
  const fileName = makeFileNameFromUrl(link);
  const fullPathToFile = path.join(saveToDir, fileName);
  await saveAsHtml(fullPathToFile, htmlContent);
  // console.log(htmlContent);
  return { filepath: fullPathToFile };
};

const downloadAsset = async (dirname, { url, filename }) => {
  const response = await axios.get(url.toString(), { responseType: 'arraybuffer' });
  const fullPath = path.join(dirname, filename);
  await fsp.writeFile(fullPath, response.data);
  return fullPath;
};



// Вариант 2:
// const tempDir = await fsp.mkdtemp(
//   path.join('/Users/ekaterinamavlutova/Desktop', 'pageLoader-'),
// ); // создаем временную директорию
// const tempDirForFiles = await fsp.mkdir(path.join(tempDir, 'files'), { recursive: true });
// console.log(tempDirForFiles);
// const pageHTML = await getHTML('https://sourcemaking.com'); // получаем строку с html
// const $ = cheerio.load(pageHTML); // получаем объект cheerio
// await pageLoader('https://sourcemaking.com', tempDir); // скачиваем html в файл
// const links = []; // создаем пустой массив для ссылок на картинки
// const elements = []; // массив для элементов, которые нужно заменить???
// $('img').each((i, element) => {
//   if ($(element).attr('src')) {
//     links.push($(element).attr('src'));
//     elements.push($(element));
//   }
// }); // добавляем в массив ссылки на картинки
// // console.log(links);
// // console.log(elements);
// const newLinks = links.map((item) => new URL(item, 'https://sourcemaking.com')); // делаем полные ссылки из относительных
// const promises = await Promise.allSettled(newLinks.map((item) => downloadAsset(
//   tempDirForFiles,
//   { url: item, filename: item.pathname.toString().replaceAll('/', '-') },
// ))); // скачиваем ссылки в указанную директорию
// const fullLinks = promises.map(({ value }) => value.slice(value.indexOf('files')));
// // console.log(fullLinks);
// elements.forEach((element, i) => {
//   // console.log(element);
//   $(element).attr('src', fullLinks[i]);
//   // console.log($(element).attr('src'));
// });
// saveAsHtml(path.join(tempDir, 'sourcemaking-com.html'), $.html());
// // await saveAsHtml(fixturesPath('new.html'), pageHTML);
// // await saveAsHtml('/Users/ekaterinamavlutova/Desktop/new.html', pageHTML);

// console.log(await pageLoader('https://ru.hexlet.io/courses', '/Users/ekaterinamavlutova/Desktop'));
export default pageLoader;


