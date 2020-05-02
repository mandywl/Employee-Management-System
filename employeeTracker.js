var mysql = require("mysql");
var inquirer = require("inquirer");
var figlet = require("figlet");
const cTable = require("console.table");
const util = require("util");

// create the connection information for the sql database
var connection = mysql.createConnection({
  host: "localhost",

  // Your port; if not 3306
  port: 3306,

  // Your username
  user: "root",

  // Your password
  password: "Din@saur33",
  database: "employeeTracker_DB",
});

// connect to the mysql server and sql database
connection.connect(function (err) {
  if (err) throw err;
  printASCII();
  console.log("connected as id " + connection.threadId + "\n");
  // run the init function after the connection is made to prompt the user
  setTimeout(function () {
    init();
  }, 1000);
  //test();
});

function printASCII() {
  figlet("Employee Manager", function (err, data) {
    if (err) {
      console.log("Something went wrong...");
      console.dir(err);
      return;
    }
    console.log(data);
  });
}
// function which prompts the user for what action they should take
function promptUser(questions) {
  return inquirer.prompt(questions);
}

function getEmployeeData() {
  return new Promise(function (resolve, reject) {
    const employeeList = [];
    connection.query(
      "SELECT id, CONCAT(first_name,' ',last_name) as employee_name FROM employee",
      function (err, res) {
        if (err) throw err;
        res.forEach((employee) => {
          employeeList.push({
            name: employee.employee_name,
            value: employee.id,
          });
        });
        resolve(employeeList);
      }
    );
  });
}

// function getManager() {
//   return new Promise(function (resolve, reject) {
//     const managerList = [];
//     connection.query(
//       "SELECT DISTINCT emp.manager_id, CONCAT(mgr.first_name,' ',mgr.last_name) as manager FROM employee as emp left outer join employee as mgr on emp.manager_id=mgr.id where CONCAT(mgr.first_name,' ',mgr.last_name) is not null;",
//       function (err, res) {
//         if (err) throw err;
//         res.forEach((element) => {
//           managerList.push({
//             name: element.manager,
//             value: element.manager_id,
//           });
//         });
//         resolve(managerList);
//       }
//     );
//   });
// }

function getManager(cb) {
  var queryString =
    "SELECT DISTINCT emp.manager_id, CONCAT(mgr.first_name,' ',mgr.last_name) as manager FROM employee as emp left outer join employee as mgr on emp.manager_id=mgr.id where CONCAT(mgr.first_name,' ',mgr.last_name) is not null";
  connection.query(queryString, function (err, res) {
    if (err) throw err;
    cb(res);
  });
}

// function getRole() {
//   return new Promise(function (resolve, reject) {
//     const roleList = [];
//     connection.query("SELECT * FROM role", function (err, res) {
//       if (err) throw err;
//       res.forEach((role) => {
//         roleList.push({
//           value: role.id,
//           name: role.title,
//         });
//       });
//       resolve(roleList);
//     });
//   });
// }

function getRole() {
  const queryAsync = util.promisify(connection.query).bind(connection);
  var queryString = "SELECT * FROM role";
  return queryAsync(queryString);
}

async function mapRoleData() {
  const roleData = await getRole();
  const roleList = [];
  roleData.forEach((role) => {
    roleList.push({
      value: role.id,
      name: role.title,
    });
  });
  return roleList;
}

function getDepartment() {
  return new Promise(function (resolve, reject) {
    const departmentList = [];
    connection.query("SELECT * FROM department", function (err, res) {
      if (err) throw err;
      res.forEach((department) => {
        departmentList.push({
          value: department.id,
          name: department.name,
        });
      });
      resolve(departmentList);
    });
  });
}

function viewAllEmployees() {
  connection.query(
    "SELECT emp.id, emp.first_name, emp.last_name, role.title, department.name as department, role.salary, CONCAT(mgr.first_name,' ',mgr.last_name) as manager FROM employee as emp left outer join employee as mgr on emp.manager_id=mgr.id left join role on emp.role_id=role.id left join department on role.department_id=department.id",
    function (err, res) {
      if (err) throw err;
      console.table(res);
      setTimeout(function () {
        init();
      }, 1000);
    }
  );
}

async function deleteEmployee() {
  const employeeList = await getEmployeeData();
  const results = await inquirer.prompt([
    {
      name: "employee_name",
      type: "list",
      message: "Which employee do you want to remove?",
      choices: employeeList.map(({ name }) => name),
    },
  ]);
  connection.query(
    "delete from employee where CONCAT(first_name,' ',last_name)=?",
    [results.employee_name],
    function (err, res) {
      if (err) throw err;
      console.log(results.employee_name, " has been removed from the database");
      setTimeout(function () {
        init();
      }, 1000);
    }
  );
}

async function viewAllEmployeesByDepartment() {
  const departmentList = await getDepartment();
  const results = await inquirer.prompt([
    {
      name: "department_name",
      type: "list",
      message: "Please select a department?",
      choices: departmentList.map(({ name }) => name),
    },
  ]);
  connection.query(
    "SELECT emp.id, emp.first_name, emp.last_name, role.title, department.name as department, role.salary, CONCAT(mgr.first_name,' ',mgr.last_name) as manager FROM employee as emp left outer join employee as mgr on emp.manager_id=mgr.id left join role on emp.role_id=role.id left join department on role.department_id=department.id where department.name=?",
    [results.department_name],
    function (err, res) {
      if (err) throw err;
      console.table(res);
      setTimeout(function () {
        init();
      }, 1000);
    }
  );
}

function viewAllEmployeesByManager() {
  const managerList = [];
  getManager(async function (res) {
    res.forEach((element) => {
      managerList.push({
        name: element.manager,
        value: element.manager_id,
      });
    });
    const results = await inquirer.prompt([
      {
        name: "manager_name",
        type: "list",
        message: "Please select a manager?",
        choices: managerList.map(({ name }) => name),
      },
    ]);
    connection.query(
      "SELECT emp.id, emp.first_name, emp.last_name, role.title, department.name as department, role.salary, CONCAT(mgr.first_name,' ',mgr.last_name) as manager FROM employee as emp left outer join employee as mgr on emp.manager_id=mgr.id left join role on emp.role_id=role.id left join department on role.department_id=department.id where CONCAT(mgr.first_name,' ',mgr.last_name)=?",
      [results.manager_name],
      function (err, res) {
        if (err) throw err;
        console.table(res);
        setTimeout(function () {
          init();
        }, 1000);
      }
    );
  });
}

async function viewDepartments() {
  connection.query("SELECT * from department", function (err, res) {
    if (err) throw err;
    console.table(res);
    setTimeout(function () {
      init();
    }, 1000);
  });
}

async function viewRoles() {
  connection.query("SELECT * from role", function (err, res) {
    if (err) throw err;
    console.table(res);
    setTimeout(function () {
      init();
    }, 1000);
  });
}

async function addNewEmployee() {
  const employeeList = await getEmployeeData();
  const roleList = await mapRoleData();
  console.log(roleList);
  const results = await inquirer.prompt([
    {
      name: "first_name",
      type: "input",
      message: "What is the employee's first name?",
    },
    {
      name: "last_name",
      type: "input",
      message: "What is the employee's last name?",
    },
    {
      name: "employee_role",
      type: "list",
      message: "What is the employee's role?",
      choices: roleList,
    },
    {
      name: "employee_manager",
      type: "list",
      message: "Who is the employee's manager?",
      choices: employeeList,
    },
  ]);
  connection.query(
    "INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)",
    [
      results.first_name,
      results.last_name,
      results.employee_role,
      results.employee_manager,
    ],
    function (err, res) {
      if (err) throw err;
      console.log(
        "Added",
        results.first_name,
        results.last_name,
        "to the database"
      );
      setTimeout(function () {
        init();
      }, 1000);
    }
  );
}

async function updateEmployeeRole() {
  const employeeList = await getEmployeeData();
  const roleList = await mapRoleData();
  const results = await inquirer.prompt([
    {
      name: "employee_name",
      type: "list",
      message: "Which employee's role do you want to update?",
      choices: employeeList.map(({ name }) => name),
    },
    {
      name: "new_role",
      type: "list",
      message: "what's the employee's new role?",
      choices: roleList,
    },
  ]);
  connection.query(
    "Update employee set role_id = ? where CONCAT(first_name,' ',last_name)=?",
    [results.new_role, results.employee_name],
    function (err, res) {
      if (err) throw err;
      console.log(results.employee_name, " has been updated!");
      setTimeout(function () {
        init();
      }, 1000);
    }
  );
}

async function updateEmployeeManager() {
  const employeeList = await getEmployeeData();
  const results = await inquirer.prompt([
    {
      name: "employee_name",
      type: "list",
      message: "Which employee's manager do you want to update?",
      choices: employeeList.map(({ name }) => name),
    },
    {
      name: "new_manager",
      type: "list",
      message: "Who is the employee's new manager?",
      choices: employeeList,
    },
  ]);
  connection.query(
    "Update employee set manager_id = ? where CONCAT(first_name,' ',last_name)=?",
    [results.new_manager, results.employee_name],
    function (err, res) {
      if (err) throw err;
      console.log(results.employee_name, "has been updated!");
      setTimeout(function () {
        init();
      }, 1000);
    }
  );
}

async function addDepartment() {
  const results = await inquirer.prompt([
    {
      name: "department_name",
      type: "input",
      message: "Please enter a new department.",
    },
  ]);
  connection.query(
    "INSERT INTO department (name) VALUES (?)",
    [results.department_name],
    function (err, res) {
      if (err) throw err;
      console.log(results.department_name, "has been added!");
      setTimeout(function () {
        init();
      }, 1000);
    }
  );
}

function validateSalary(salary) {
  var reg = /\d+(\.\d{1,2})?/;
  return reg.test(salary) || "Please enter a valid salary (e.g. 100000.00)!";
}

async function addRole() {
  const departmentList = await getDepartment();
  const results = await inquirer.prompt([
    {
      name: "role_title",
      type: "input",
      message: "Please enter a new role.",
    },
    {
      name: "salary",
      type: "input",
      message: "What's the salary for this role (e.g. 100000.00)?",
      validate: validateSalary,
    },
    {
      name: "department",
      type: "list",
      message: "Please select a department for this new role.",
      choices: departmentList,
    },
  ]);
  connection.query(
    "INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)",
    [results.role_title, results.salary, results.department],
    function (err, res) {
      if (err) throw err;
      console.log(results.role_title, "has been added to the role table!");
      setTimeout(function () {
        init();
      }, 1000);
    }
  );
}

async function deleteDepartment() {
  const departmentList = await getDepartment();
  const results = await inquirer.prompt([
    {
      name: "department_name",
      type: "list",
      message: "Which department do you want to remove?",
      choices: departmentList.map(({ name }) => name),
    },
  ]);
  connection.query(
    "DELETE from department where name=?",
    [results.department_name],
    function (err, res) {
      if (err) throw err;
      console.log(results.department_name, "has been deleted!");
      setTimeout(function () {
        init();
      }, 1000);
    }
  );
}

async function deleteRole() {
  const roleList = await mapRoleData();
  const results = await inquirer.prompt([
    {
      name: "role_title",
      type: "list",
      message: "Which role do you want to remove?",
      choices: roleList.map(({ name }) => name),
    },
  ]);
  connection.query(
    "DELETE from role where title=?",
    [results.role_title],
    function (err, res) {
      if (err) throw err;
      console.log(results.role_title, "has been deleted!");
      setTimeout(function () {
        init();
      }, 1000);
    }
  );
}

const questions = [
  {
    name: "selections",
    type: "list",
    message: "What would you like to do?",
    choices: [
      "View All Employees",
      "View All Employees By Department",
      "View All Employees By Manager",
      "View Departments",
      "View Roles",
      "Add Employee",
      "Remove Employee",
      "Add Department",
      "Add Role",
      "Delete Department",
      "Delete Role",
      "Update Employee Role",
      "Update Employee Manager",
      "Exit",
    ],
  },
];

// function doSomething(){
//   // get value from db
//   somePbj.choice = value from database
// }

// const somePbj = {};
async function init() {
  try {
    const { selections } = await promptUser(questions);
    switch (selections) {
      case "View All Employees":
        viewAllEmployees();
        break;
      case "View All Employees By Department":
        viewAllEmployeesByDepartment();
        break;
      case "View All Employees By Manager":
        viewAllEmployeesByManager();
        break;
      case "View Departments":
        viewDepartments();
        break;
      case "View Roles":
        viewRoles();
        break;
      case "Add Employee":
        addNewEmployee();
        break;
      case "Remove Employee":
        deleteEmployee();
        break;
      case "Update Employee Role":
        updateEmployeeRole();
        break;
      case "Update Employee Manager":
        updateEmployeeManager();
        break;
      case "Add Department":
        addDepartment();
        break;
      case "Add Role":
        addRole();
        break;
      case "Delete Department":
        deleteDepartment();
        break;
      case "Delete Role":
        deleteRole();
        break;
      default:
        process.exit();
    }
  } catch (err) {
    console.log(err);
  }
}
