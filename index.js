#!/usr/bin/env node

const express = require('express');
const app = express()
const port = 8085;
const https = require('https').Server(app)
const {
 parse
} = require('node-html-parser');
const fs = require('fs');
const chalk = require('chalk');
const {
 askTitle,
 showOptions,
 askAllOrOne
} = require('./interface');
const {
 sendTitleRequest,
 goToSelectedSub,
 download
} = require('./requests');
const FileType = require('file-type');
const Promise = require('bluebird');

async function startProcess() {
 const allOrOne = await askAllOrOne();
 const {
  title
 } = await askTitle();
 switch (allOrOne.option) {
  case 'one':
   oneSubHandler(title)
   break;
  case 'all':
   allSubsHandler(title)
   break;
  case 'season':
   seasonSubsHandler(title)
   break;
  default:
 }
}

async function oneSubHandler(title) {
 const data = await sendTitleRequest(title);
 const elements = await getElements(data);
 const selectedOption = await showOptions(elements)
 const subPageData = await goToSelectedSub(selectedOption)
 const downloadLink = await getDownloadLink(subPageData)
 const filePath = await download({
  downloadLink: downloadLink
 });
 const subtitleFile = await addExtension(filePath);
 console.log({
  subtitleFile
 });
 process.exit();
}

async function allSubsHandler(title) {
 const data = await sendTitleRequest(title);
 const elements = await getElements(data);
 const allSubsPageData = await getAllSubsPageData(elements)
 const allSubsLinks = allSubsPageData.map((item) => getDownloadLink(item));
 const filesPaths = await downloadAllSubs(allSubsLinks)
 const extensionPromises = filesPaths.map((item) => {
  return addExtension(item)
 });
 Promise.all(extensionPromises).then((res) => {
  // subtitles Files with extension
  res.forEach((item) => {
   console.log(chalk.green(item));
  });
  process.exit()
 })
}

async function seasonSubsHandler(title) {
 checkTitle(title).then(async () => {
  do {
   const data = await sendTitleRequest(title);
   const elements = await getElements(data);
   const allSubsPageData = await getAllSubsPageData(elements)
   const allSubsLinks = allSubsPageData.map((item) => getDownloadLink(item));
   const capitulo = title.substring(title.length - 2, title.length)
   const filesPaths = await downloadAllSubs(allSubsLinks, capitulo)
   const extensionPromises = filesPaths.map((item) => {
    return addExtension(item)
   });
   Promise.all(extensionPromises).then((res) => {
    // subtitles Files with extension
    res.forEach((item) => {
     console.log(chalk.green(item));
    });
   })
   const nextChapter = getNextChapter(title);
   const titleWithoutChapter = title.substring(0, title.length - 2)
   const titleWithNextChapter = titleWithoutChapter + nextChapter
   console.log(chalk.bold(`Starting with ${titleWithNextChapter}`));
   title = titleWithNextChapter;
  } while (true);
 });
 process.exit()
}

function getNextChapter(title) {
 const lastCharacters = Number(title.slice(-2));
 const next = lastCharacters + 1;
 if (next >= 10) {
  return next
 } else {
  return String('0' + next)
 }
}

function getElements(data) {
 return new Promise(function (resolve) {
  const page = parse(data);
  const subs = page.querySelectorAll('.titulo_menu_izq');
  if (subs.length < 1) {
   console.log(chalk.red('No se encontraron subtitulos'));
   process.exit()
  }
  const descriptions = page.querySelectorAll('#buscador_detalle_sub');
  const formatedSubs = subs.map((item, i) => {
   const fixedString = descriptions[i].text.replace(/(\r\n|\n|\r)/gm, '')
   return {
    name: fixedString,
    value: item.getAttribute('href')
   }
  });
  resolve(formatedSubs)
 });
}

function getDownloadLink(subPageData) {
 const subPage = parse(subPageData);
 const link = subPage.querySelectorAll('.link1')[0].getAttribute('href')
 console.log({
  link
 });
 const escapedLink = encodeURI(link)
 return escapedLink
}

function addExtension(filepath) {
 return new Promise(function (resolve) {
  FileType.fromFile(filepath).then((data) => {
   fs.rename(filepath, `${filepath}.${data.ext}`, (err) => {
    if (err) {
     throw err;
    }
    resolve(`${filepath}.${data.ext}`)
   })
  })
 });
}

function getAllSubsPageData(elements) {
 return Promise.mapSeries(elements, function (currentElement) {
  return goToSelectedSub(currentElement)
   .then(function (dataOneSub) {
    console.log(chalk.green(`Successfully obtained: ${currentElement.name}\n`));
    return dataOneSub
   })
   .catch(function (err) {
    console.log(chalk.red('ERROR'));
    console.log(err);
   });
 }, {
  concurrency: 1
 })
  .then(function (data) {
   console.log(chalk.bgGreen.bold('SUCCESS OBTAINING ALL SUBS PAGE DATA'));
   return (data)
  }).catch(function (err) {
   console.log('ERROR');
   console.log(err);
  });
}

function downloadAllSubs(elements, capitulo) {
 return Promise.map(elements, function (currentElement) {
  return download({
   downloadLink: currentElement,
   directory: capitulo
  })
   .then(function (filepath) {
    console.log(chalk.green(`Downloaded: ${currentElement}\n`));
    return filepath
   })
   .catch(function (err) {
    console.log(chalk.red('ERROR'));
    console.log(err);
   });
 }, {
  concurrency: 1
 })
  .then(function (data) {
   console.log(chalk.bgGreen.bold('SUCCESS DOWNLOADING ALL SUBS'));
   return data
  }).catch(function (err) {
   console.log('ERROR');
   console.log(err);
  });
}

function checkTitle(title) {
 title = title.trim()
 const lastWord = title.split(' ').pop();
 const exp = /s\d{2}e\d{2}/gi;
 const hasCorrectSyntax = exp.test(lastWord);
 if (!hasCorrectSyntax) {
  console.log(chalk.red(`Escribe bien la temporada y el capitulo. Ej: Black Mirror ${chalk.inverse('s02e04')}`));
  process.exit()
 } else {
  return true;
 }
}

https.listen(port, function (err) {
 if (err) return console.log(err);
 console.log(`Server corriendo en el puerto ${port}`);
 startProcess();
})
