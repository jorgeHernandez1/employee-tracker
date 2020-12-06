const connection = require("./config/connection");
const inquirer = require("inquirer");
const figlet = require("figlet");
const cTable = require("console.table");

///initiazlizes app
const init = () => {
  connection.connect((err) => {
    if (err) {
      throw err;
    } else {
      //dislpay ascii banner using figlet async funciton to ensure proper order
      console.log(
        figlet.textSync("Employee\n\nManager", {
          font: "Standard",
          horizontalLayout: "fitted",
          verticalLayout: "full",
          whitespaceBreak: true,
        })
      );
      //call user prompt
      manageEmployees();
    }
  });
};

const manageEmployees = () => {
  //primary user prompt function
  inquirer
    .prompt([
      {
        name: "userSelection",
        type: "list",
        message: "What would you like to do?",
        choices: [
          "View All Employees",
          "View All Departments",
          "View All Roles",
          "Add Employee",
          "Add Department",
          "Add Role",
          "Update Employee Role",
          "Exit",
        ],
      },
    ])
    .then((answer) => {
      switch (answer.userSelection) {
        case "Add Employee":
          addEmployee();
          break;

        case "Add Department":
          addDepartment();
          break;

        case "Add Role":
          addRole();
          break;

        case "View All Employees":
          viewData("Employees");
          break;

        case "View All Departments":
          viewData("Departments");
          break;

        case "View All Roles":
          viewData("Roles");
          break;

        case "Update Employee Role":
          updateRole();
          break;

        default:
          connection.end();
      }
    });
};

const updateRole = async () => {
  //refreshes roles and employees that are used to add new emp
  const roles = await getRoles();
  const [employees, ids] = await getEmployees();

  inquirer
    .prompt([
      {
        name: "employee",
        message: "Which employee would you like to update?",
        type: "list",
        choices: employees,
      },
      {
        name: "newRole",
        message: "What is the employees new role?",
        type: "list",
        choices: roles,
      },
    ])
    .then((answer) => {
      const query = `
      UPDATE 
        employee
      SET
        role_id = (
          SELECT 
            id 
          FROM
            role AS tmp
          WHERE
            title = '${answer.newRole}')
      WHERE
        id = ${ids[answer.employee]}
        `;

      connection.query(query, (err, res) => {
        if (err) {
          throw err;
        } else {
            console.log(`${answer.employee} has been assigned a new role as ${answer.newRole}.`);
        }
        manageEmployees();
        });
  });
}

const viewData = async (tbl) => {
  let query = "";
  //handle param to build query
  switch (tbl) {
    case "Employees":
      query = `
        SELECT 
          employee.id,
          employee.first_name,
          employee.last_name,
          role.title,
          department.name as department,
          role.salary,
          (SELECT 
          CONCAT(employee.first_name,' ', employee.last_name) As manager
        FROM 
          employee AS tmp
        WHERE
          tmp.id = employee.manager_id
        ) as manager
        FROM 
          employee
        JOIN
          role
        ON
          employee.role_id = role.id
        JOIN
          department
        ON
          role.department_id = department.id
  `;
      break;

    case "Roles":
      query = `
        SELECT 
          role.id,
          role.title,
          role.salary,
          department.name as department_name
        FROM 
          role
        JOIN
          department
        ON
          role.department_id = department.id
  `;
      break;

    case "Departments":
      query = `
      SELECT 
        d.id,
        d.name,
        COUNT(*) AS total_employees
      FROM 
        employee AS e
      JOIN
        role AS r
      ON
        e.role_id = r.id
      JOIN
        department AS d
      ON
        r.department_id = d.id
      GROUP BY
        d.id
  `;
      break;
  }
  //query db and wait for results to be ready
  const rows = await queryDB(query);
  //display results
  console.table(rows);
  //reprompt user
  manageEmployees();
};

const addRole = async () => {
  //get departments from db to use for prompt and ids for query
  const [departments, ids] = await getDepartments();

  inquirer
    .prompt([
      {
        name: "department",
        message: "What department is the new role in?",
        type: "list",
        choices: departments,
      },
      {
        name: "title",
        message: "What is the title for the new role?",
        type: "input",
      },
      {
        name: "baseSalary",
        message: "What is the base salary for the new role?",
        type: "input",
      },
    ])
    .then((answer) => {
      /*this query will insert (title, salary, department_id) into roles
        If the current role does not already exist in the same department
      */

      const query = `
          INSERT INTO 
            role(title, salary, department_id)
          SELECT * FROM ( 
            SELECT
              '${answer.title}',
              ${answer.baseSalary},
              ${ids[answer.department]}
          ) as tmp
           WHERE NOT EXISTS (
             SELECT 
              title 
            FROM 
              role 
            WHERE 
              title = '${answer.title} AND id = ${ids[answer.department]}'
         ) LIMIT 1;
         `;

      connection.query(query, (err, res) => {
        if (err) {
          throw err;
        } else {
          //check to see if any rows were updated
          if (res.affectedRows > 0) {
            console.log(`New ${answer.department} role added succesfully.`);
          } else {
            console.log(
              `Role already exists in ${answer.department} department.`
            );
          }
          manageEmployees();
        }
      });
    });
};

const addDepartment = () => {
  inquirer
    .prompt([
      {
        name: "department",
        message: "What is the department name?",
        type: "input",
      },
    ])
    .then((answer) => {
      /*this query will insert (name) into department
        If the current department does not already exist
      */
      const query = `
        INSERT INTO 
          department(name)
        SELECT * FROM (SELECT '${answer.department}' as name) as tmp
        WHERE NOT EXISTS (
          SELECT name FROM department WHERE name = '${answer.department}'
      ) LIMIT 1;
      `;

      connection.query(query, (err, res) => {
        if (err) {
          throw err;
        } else {
          //check to see if any rows were updated
          if (res.affectedRows > 0) {
            console.log("Department succesfully added.");
          } else {
            console.log("Department already exists.");
          }
          manageEmployees();
        }
      });
    });
};

const addEmployee = async () => {
  //refreshes roles and employees that are used to add new emp
  const roles = await getRoles();
  const [employees, ids] = await getEmployees();
  //add a none option for selecting a manager
  employees.push("None");

  inquirer
    .prompt([
      {
        name: "firstName",
        message: "What is the employees first name?",
        type: "input",
      },
      {
        name: "lastName",
        message: "What is the employees last name?",
        type: "input",
      },
      {
        name: "role",
        message: "What is the employees role?",
        type: "list",
        choices: roles,
      },
      {
        name: "manager",
        message: "Who is the employees manager?",
        type: "list",
        choices: employees,
      },
    ])
    .then((answer) => {
      /**
       * this query will insert (first_name, last_name, role_id, manager_id) into department
        and will provide a null value to manager_id if the manager selected was "None"
       */
      const query = `
        INSERT INTO 
          employee(first_name, last_name, role_id, manager_id)
        SELECT 
          '${answer.firstName}',
          '${answer.lastName}',
          id,
          IF(STRCMP('${answer.manager}','None') = 0,null,'${
        ids[answer.manager]
      }')
        FROM 
          role 
        WHERE title = '${answer.role}'
           `;

      connection.query(query, (err, res) => {
        if (err) {
          throw err;
        } else {
          console.log(
            `${answer.firstName} ${answer.lastName} Added Succesfully.`
          );
          manageEmployees();
        }
      });
    });
};

const getRoles = async () => {
  let roles = [];
  const query = `
    SELECT 
      title 
    FROM 
      role;
  `;

  const rows = await queryDB(query);
  //add results to roles arr
  rows.forEach((val) => {
    roles.push(val.title);
  });

  return roles;
};

const getEmployees = async () => {
  let employees = [];
  let ids = {};

  const query = `
    SELECT 
      first_name, last_name, id
    FROM 
      employee;
  `;

  const rows = await queryDB(query);
  /*loop through response and push to employees arr that is used for inq choices
   *also collects id's in object used for queries
   */
  rows.forEach((val) => {
    employees.push(`${val.first_name} ${val.last_name}`);
    ids[`${val.first_name} ${val.last_name}`] = val.id;
  });

  return [employees, ids];
};

const getDepartments = async () => {
  let departments = [];
  let ids = {};

  const query = `SELECT * FROM department;`;

  const rows = await queryDB(query);
  /*loop through response and push to employees arr that is used for inq choices
   *also collects id's in object used for queries
   */
  rows.forEach((val) => {
    departments.push(val.name);
    ids[val.name] = val.id;
  });

  return [departments, ids];
};

//created querying function that returns promise to be used when we need to await results
//from dbbefore running code
const queryDB = async (sql, args) => {
  return new Promise((resolve, reject) => {
    connection.query(sql, args, (err, rows) => {
      if (err) {
        return reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

//start app
init();
