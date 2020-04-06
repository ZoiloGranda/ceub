const axios = require('axios');
const chalk = require('chalk');
const fs = require('fs');
const axiosRetry = require('axios-retry');

axiosRetry(axios, {
	retries: 3,
	retryCondition: function(error) {
		console.log(chalk.yellow('Retrying, please wait...'));
		if (axiosRetry.isNetworkOrIdempotentRequestError(error)) {
			return true
		}
		if (error.errno === -3001 && error.code === 'EAI_AGAIN') {
			return true
		} else {
			return false
		}
	},
	retryDelay: function(retryCount) {
		return retryCount * 10000;
	}
});

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
			console.log(chalk.red('Connection error, try again later'));
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
		let directory = params.directory ? `/subs/${params.directory}` : '/subs';
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
				console.log(chalk.green.inverse(`Subtitle downloaded successfully to ${__dirname}${directory}`));
				resolve(`${__dirname}${directory}/${id}`)
			});
		}).catch(function(e) {
			console.log(e);
			process.exit()
		})
	});
}


module.exports = {
	sendTitleRequest,
	goToSelectedSub,
	download
}