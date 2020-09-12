const axios = require('axios');
const chalk = require('chalk');
const fetch = require('node-fetch');
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
			timeout: 30000,
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
			timeout: 30000,
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
	console.log({params});
	https://www.subdivx.com/bajar.php?id=275140&u=7
	console.log(chalk.cyan('Downloading subtitle, please wait'));
	return new Promise(function(resolve, reject) {
		let url = new URL(params.downloadLink, 'https://www.subdivx.com/');
		https://www.subdivx.com/sub7/275140.rar
		console.log({url});
		console.log(url.href);
		let id = url.searchParams.get('id');
		let directory = params.directory ? `/subs/${params.directory}` : '/subs';
		fetch("https://www.subdivx.com/bajar.php?id=275140&u=7", {
  "headers": {
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    "accept-language": "es-419,es;q=0.9,en;q=0.8",
    "cache-control": "no-cache",
    "pragma": "no-cache",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
    "cookie": "__utmc=71506321; __utmz=71506321.1592828692.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none); iduser_cookie=VkZaU1FtVnJOVlZTVkZKUFpIb3dPUT09; nick_cookie=VmtWak5XVldjRVpTYm14aFYwVktidz09; email_cookie=V2xjeGEyVldiRmhPVjNSYVZsVktkVmxzWkVkalIwcEVUbGR3YVUxcVFUaz0%3D; pais_cookie=VkZoak9WQlJQVDA9; moderador_cookie=VkZWRk9WQlJQVDA9; traductor_cookie=VkZWRk9WQlJQVDA9; fue_usuario=1; pak=0a2d6a74a99491dc695aa6e40268d07f; __cfduid=d6f6e2be6bbc7990747c159296ba6a2381599917736; __utma=71506321.215220599.1592828692.1596909691.1599917739.4; con_impr=7; bajo_una_vez=1; bajo_una_vez_diario=1; cs15=226865; cs14=275140; cs13=540811; cant_down=6; contd=4; cs12=227934; __cf_bm=f09608326cd66626de0beabe3fb3e13ec2c59640-1599923182-1800-AfObxOOwAVgLUK383oyzvRNd/zvBarJT1oskhgXdFIqG"
  },
  "referrerPolicy": "no-referrer-when-downgrade",
  "body": null,
  "method": "GET",
  "mode": "cors"
})
		// axios({
		// 	method: "get",
		// 	url: url.href,
		// 	timeout: 30000,
		// 	responseType: "stream"
		// })
		.then(function(response) {
			console.log({response});
			if (!fs.existsSync(`.${'/subs'}`)) {
				fs.mkdirSync(`.${'/subs'}`);
			}
			if (!fs.existsSync(`.${directory}`)) {
				fs.mkdirSync(`.${directory}`);
			}
			let stream = response.body.pipe(fs.createWriteStream(`${__dirname}${directory}/${id}`));
			console.log(`${__dirname}${directory}/${id}`);
			stream.on('finish', () => {
				console.log(chalk.green.inverse(`Subtitle downloaded successfully to ${__dirname}${directory}`));
				resolve(`${__dirname}${directory}/${id}`)
			});
		}).catch(function(e) {
			console.log({e});
			process.exit()
		})
	});
}


module.exports = {
	sendTitleRequest,
	goToSelectedSub,
	download
}