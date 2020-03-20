const express = require('express');
const app = express()
const port = 8085;
const https = require('https').Server(app)
const {
	parse
} = require('node-html-parser');
const dotenv = require('dotenv').config();
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
	let allOrOne = await askAllOrOne();
	console.log({
		allOrOne
	});
	let {
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
	let data = await sendTitleRequest(title);
	let elements = await getElements(data);
	let selectedOption = await showOptions(elements)
	let subPageData = await goToSelectedSub(selectedOption)
	let downloadLink = await getDownloadLink(subPageData)
	let filePath = await download(downloadLink);
	let subtitleFile = await addExtension(filePath);
	console.log({
		subtitleFile
	});
	process.exit();
}

async function allSubsHandler(title) {
	let data = await sendTitleRequest(title);
	let elements = await getElements(data);
	let allSubsPageData = await getAllSubsPageData(elements)
	let allSubsLinks = allSubsPageData.map((item, i) => getDownloadLink(item));
	let filesPaths = await downloadAllSubs(allSubsLinks)
	let extensionPromises = filesPaths.map((item, i) => {
		return addExtension(item)
	});
	let subtitlesFilesWithExt = Promise.all(extensionPromises).then((res) => {
		res.forEach((item, i) => {
			console.log(chalk.green(item));
		});
		process.exit()
	})
}

async function seasonSubsHandler(title){
	let isValidTitle = await checkTitle(title);
	do {
		let data = await sendTitleRequest(title);
		let elements = await getElements(data);
		let allSubsPageData = await getAllSubsPageData(elements)
		let allSubsLinks = allSubsPageData.map((item, i) => getDownloadLink(item));
		let filesPaths = await downloadAllSubs(allSubsLinks)
		let extensionPromises = filesPaths.map((item, i) => {
			return addExtension(item)
		});
		let subtitlesFilesWithExt = Promise.all(extensionPromises).then((res) => {
			res.forEach((item, i) => {
				console.log(chalk.green(item));
			});
		})
		let nextChapter = await getNextChapter(title);
		let titleWithoutChapter = title.substring(0,title.length-2)
		let titleWithNextChapter = titleWithoutChapter + nextChapter
		console.log(chalk.bold(`Starting with ${titleWithNextChapter}`));
		title = titleWithNextChapter;
	} while (true);
		process.exit()
}

function getNextChapter(title) {
	let lastCharacters = Number(title.slice(-2));
	let next = lastCharacters + 1;
	if (next>=10) {
		return next
	}else {
		return String('0'+next)
	}
}

function getElements(data) {
	return new Promise(function(resolve, reject) {
		let page = parse(data);
		let subs = page.querySelectorAll('.titulo_menu_izq');
		if (subs.length < 1) {
			console.log(chalk.red('No se encontraron subtitulos'));
			process.exit()
		}
		let descriptions = page.querySelectorAll('#buscador_detalle_sub');
		let stats = page.querySelectorAll('#buscador_detalle_sub_datos');
		let formatedSubs = subs.map((item, i) => {
			let fixedString = descriptions[i].text.replace(/(\r\n|\n|\r)/gm, "")
			return {
				name: fixedString,
				value: item.getAttribute('href')
			}
		});
		resolve(formatedSubs)
	});
}

function getDownloadLink(subPageData) {
	let subPage = parse(subPageData);
	let link = subPage.querySelectorAll('.link1')[0].getAttribute('href')
	console.log({
		link
	});
	let escapedLink = encodeURI(link)
	return escapedLink
}

function addExtension(filepath) {
	return new Promise(function(resolve, reject) {
		FileType.fromFile(filepath).then((data) => {
			fs.rename(filepath, `${filepath}.${data.ext}`, (err) => {
				if (err) throw err;
				resolve(`${filepath}.${data.ext}`)
			})
		})
	});
}

function getAllSubsPageData(elements) {
	return Promise.mapSeries(elements, function(currentElement) {
			return goToSelectedSub(currentElement)
				.then(function(dataOneSub) {
					console.log(chalk.green(`Successfully obtained: ${currentElement.name}\n`));
					return dataOneSub
				})
				.catch(function(err) {
					console.log(chalk.red('ERROR'));
					console.log(err);
				});
		}, {
			concurrency: 1
		})
		.then(function(data) {
			console.log(chalk.bgGreen.bold('SUCCESS OBTAINING ALL SUBS PAGE DATA'));
			return (data)
		}).catch(function(err) {
			console.log('ERROR');
			console.log(err);
		});
}

function downloadAllSubs(elements) {
	return Promise.map(elements, function(currentElement) {
			return download(currentElement)
				.then(function(filepath) {
					console.log(chalk.green(`Downloaded: ${currentElement}\n`));
					return filepath
				})
				.catch(function(err) {
					console.log(chalk.red('ERROR'));
					console.log(err);
				});
		}, {
			concurrency: 1
		})
		.then(function(data) {
			console.log(chalk.bgGreen.bold('SUCCESS DOWNLOADING ALL SUBS'));
			return data
		}).catch(function(err) {
			console.log('ERROR');
			console.log(err);
		});
}

function checkTitle(title){
	title = title.trim()
	let lastWord = title.split(" ").pop();
	let exp = new RegExp(/s\d{2}e\d{2}/gi);
	let hasCorrectSyntax = exp.test(lastWord);
	if (!hasCorrectSyntax) {
		console.log(chalk.red('Escribe bien la temporada y el capitulo. Ej: Black Mirror s02e04'));
		process.exit()
	}else {
		return true;
	}
}

https.listen(port, function(err) {
	if (err) return console.log(err);
	console.log(`Server corriendo en el puerto ${port}`);
	startProcess();
})