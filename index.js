const express = require('express');
const app = express()
const port = 8085;
const https = require('https').Server(app)
const axios = require('axios');
const {
	parse
} = require('node-html-parser');
const dotenv = require('dotenv').config();
const fs = require('fs');
const chalk = require('chalk');
const {
	askTitle,
	showOptions
} = require('./interface');
const FileType = require('file-type');


async function startProcess() {
	let {
		title
	} = await askTitle();
	let data = await sendTitleRequest(title);
	let elements = await getElements(data);
	let selectedOption = await showOptions(elements)
	let subPageData = await goToSelectedSub(selectedOption)
	let downloadLink = await getDownloadLink(subPageData)
	let filePath = await download(downloadLink)
	let subtitleFile = await addExtension(filePath)
}

function sendTitleRequest(title) {
	console.log(chalk.cyan('Searching subtitles, please wait'));
	return axios({
			method: 'get',
			url: 'https://www.subdivx.com/index.php',
			params: {
				buscar: title,
				accion: 5,
				masdesc: '',
				subtitulos: 1,
				realiza_b: 1
			}
		})
		.then(function(response) {
			return (response.data)
		})
		.catch(function(error) {
			console.log(error);
			process.exit()
		});
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

function goToSelectedSub(selectedOption) {
	console.log(chalk.cyan('Going to subtitle page, please wait'));
	return axios({
			method: 'get',
			url: selectedOption.option
		})
		.then(function(response) {
			return (response.data)
		})
		.catch(function(error) {
			console.log(error);
		});
}

function getDownloadLink(subPageData) {
	let subPage = parse(subPageData);
	let link = subPage.querySelectorAll('.link1')[0].getAttribute('href')
	console.log({
		link
	});
	return link
}

function download(downloadLink) {
	console.log(chalk.cyan('Downloading subtitle, please wait'));
	return new Promise(function(resolve, reject) {
		axios({
			method: "get",
			url: downloadLink,
			responseType: "stream"
		}).then(function(response) {
			let stream = response.data.pipe(fs.createWriteStream("./mysub"));
			stream.on('finish', () => {
				console.log(chalk.green(`Subtitle downloaded successfully to ${__dirname}`));
				resolve(__dirname + '/mysub')
			});
		}).catch(function(e) {
			console.log(e);
			process.exit()
		})
	});
}

function addExtension(filepath) {
	FileType.fromFile(filepath).then((data) =>{
  // console.log(data)
  fs.renameSync(filepath, `${filepath}.${data.ext}`)
  process.exit()
 }) 
}


https.listen(port, function(err) {
	if (err) return console.log(err);
	console.log(`Server corriendo en el puerto ${port}`);
	startProcess();
})