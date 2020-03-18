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
						pageSize: 20
    }
  ])
  .then(answer => {
    return answer
  });
}

module.exports = {
	askTitle,
	showOptions
};