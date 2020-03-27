const axios = require('axios');
const chalk = require('chalk');
const fs = require('fs');

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

function goToSelectedSub(selectedOption) {
	console.log(chalk.cyan('Going to subtitle page, please wait'));
	let link = selectedOption.option || selectedOption.value
	let escapedLink = encodeURI(link)
	return axios({
			method: 'get',
			url: escapedLink
		})
		.then(function(response) {
			return (response.data)
		})
		.catch(function(error) {
			console.log(error);
		});
}

function download(params) {
	console.log(chalk.cyan('Downloading subtitle, please wait'));
	return new Promise(function(resolve, reject) {
		let url = new URL(params.downloadLink);
		let id = url.searchParams.get('id');
		let directory = params.directory ?`/subs/${params.directory}`: '/subs';
		axios({
			method: "get",
			url: params.downloadLink,
			responseType: "stream"
		}).then(function(response) {
			if (!fs.existsSync(`.${'/subs'}`)) {
				fs.mkdirSync(`.${'/subs'}`);
			}
			if (!fs.existsSync(`.${directory}`)) {
				fs.mkdirSync(`.${directory}`);
			}
			let stream = response.data.pipe(fs.createWriteStream(`.${directory}/${id}`));
			stream.on('finish', () => {
				console.log(chalk.green(`Subtitle downloaded successfully to ${__dirname}${directory}`));
				resolve(`${__dirname}${directory}/${id}`)
			});
		}).catch(function(e) {
			console.log(e);
			process.exit()
		})
	});
}


module.exports={
 sendTitleRequest,
 goToSelectedSub,
 download
 
}