import axios from 'axios';
import fsp from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const makeFileNameFromUrl = (someUrl) => {
  const myUrl = new URL(someUrl);
  const urlProtocol = myUrl.protocol;
  const urlWithoutProtocol = someUrl
    .replace(`${urlProtocol}//`, '')
    .replaceAll(/\W/g, '-');
  return `${urlWithoutProtocol}.html`;
};

const getHTML = async (url) => {
  // await axios.get(url, {
  //   headers: {
  //     Referer: url,
  //     'X-Requested-With': 'XMLHttpRequest'
  //   }
  // }).then(function (response) {
  //     console.log(response.data);
  // });
  const response = await axios.get(url);
  const pageHTML = response.data;
  return pageHTML;
};

const saveAsHtml = async (pathToFile, htmlData) => {
  await fsp.writeFile(pathToFile, htmlData, 'utf-8');
};

// const pageHTML = await getHTML('https://ru.hexlet.io/courses');
// await saveAsHtml(fixturesPath('new.html'), pageHTML);
// await saveAsHtml('/Users/ekaterinamavlutova/Desktop/new.html', pageHTML);

const pageLoader = async (link, saveToDir = process.cwd()) => {
  const htmlContent = await getHTML(link);
  const fileName = makeFileNameFromUrl(link);
  const fullPathToFile = path.join(saveToDir, fileName);
  await saveAsHtml(fullPathToFile, htmlContent);
  // console.log(htmlContent);
  return { filepath: fullPathToFile };
};
// console.log(await pageLoader('https://ru.hexlet.io/courses', '/Users/ekaterinamavlutova/Desktop'));
export default pageLoader;
