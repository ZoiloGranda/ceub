const inquirer = require('inquirer');

function askTitle() {
	return inquirer
		.prompt([{
			type: 'input',
			name: 'title',
			message: 'Cual es el nombre de la serie/pelicula?',
		}])
		.then(answer => {
			return (answer)
		});
}

function showOptions(elements) {
return inquirer
  .prompt([
    {
      type: 'list',
      name: 'option',
      message: 'Cual vas a bajar',
      // choices: elements.map((item=>item.description))
						choices: elements,
						pageSize: 10
    }
  ])
  .then(answer => {
    return answer
  });
}

function askAllOrOne(elements) {
return inquirer
  .prompt([
    {
      type: 'list',
      name: 'option',
      message: 'Uno solo o todos',
      choices: [
							{name:'Un solo subtitulo', value:'one'},
							{name:'Todos', value: 'all'}
						],
						pageSize: 10
    }
  ])
  .then(answer => {
    return answer
  });
}

module.exports = {
	askTitle,
	showOptions,
	askAllOrOne
};