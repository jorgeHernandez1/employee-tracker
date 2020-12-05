const connection = require("./config/connection");
const inquirer = require("inquirer");
const figlet = require("figlet");

function init() {
  figlet.text(
    "Employee\n\nManager",
    {
      font: "Standard",
      horizontalLayout: "fitted",
      verticalLayout: "full",
      whitespaceBreak: true,
    },
    function (err, data) {
      if (err) {
        console.log("Something went wrong...");
        console.dir(err);
        return;
      }
      console.log(data);
    }
  );

  // inquirer.prompt({}).then();
}

init();
