var mysql = require("mysql");
var inquirer = require("inquirer");
const cTable = require("console.table");

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
  console.log("connected as id " + connection.threadId + "\n");
  // run the start function after the connection is made to prompt the user
  init();
  //test();
});

const test = async () => {
  const {
    first_name,
    last_name,
    employee_role,
    employee_manager,
  } = await promptAddingEmployee(newEmployee);
  console.log(employee_role);
};

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

function getManager() {
  return new Promise(function (resolve, reject) {
    const managerList = [];
    connection.query(
      "SELECT DISTINCT emp.manager_id, CONCAT(mgr.first_name,' ',mgr.last_name) as manager FROM employee as emp left outer join employee as mgr on emp.manager_id=mgr.id where CONCAT(mgr.first_name,' ',mgr.last_name) is not null;",
      function (err, res) {
        if (err) throw err;
        res.forEach((element) => {
          managerList.push({
            name: element.manager,
            value: element.manager_id,
          });
        });
        resolve(managerList);
      }
    );
  });
}

function getRole() {
  return new Promise(function (resolve, reject) {
    const roleList = [];
    connection.query("SELECT * FROM role", function (err, res) {
      if (err) throw err;
      res.forEach((role) => {
        roleList.push({
          value: role.id,
          name: role.title,
        });
      });
      resolve(roleList);
    });
  });
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
  //console.log(employeeList);
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

async function viewAllEmployeesByManager() {
  const managerList = await getManager();
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
}

async function addNewEmployee() {
  const employeeList = await getEmployeeData();
  const roleList = await getRole();
  //console.log(employeeList);
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
        " ",
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
  const roleList = await getRole();
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

const questions = [
  {
    name: "selections",
    type: "list",
    message: "What would you like to do?",
    choices: [
      "View All Employees",
      "View All Employees By Department",
      "View All Employees By Manager",
      "Add Employee",
      "Remove Employee",
      "Update Employee Role",
      "Update Employee Manager",
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
    if (selections == "View All Employees") {
      viewAllEmployees();
    } else if (selections == "View All Employees By Department") {
      viewAllEmployeesByDepartment();
    } else if (selections == "View All Employees By Manager") {
      viewAllEmployeesByManager();
    } else if (selections == "Add Employee") {
      addNewEmployee();
    } else if (selections == "Remove Employee") {
      deleteEmployee();
    } else if (selections == "Update Employee Role") {
      updateEmployeeRole();
    } else if (selections == "Update Employee Manager") {
      updateEmployeeManager();
    }
  } catch (err) {
    console.log(err);
  }
}
