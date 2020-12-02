DROP DATABASE IF EXISTS employee_db;
CREATE database employee_db;

USE employee_db;

CREATE TABLE department (
    id int PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(30) NOT NULL
) AUTO_INCREMENT = 9000;

CREATE TABLE role (
    id int PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(30) NOT NULL,
    salary DECIMAL ,
    department_id int
)AUTO_INCREMENT = 8000;

CREATE TABLE employee(
    id int PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(30) NOT NULL,
    last_name VARCHAR(30) NOT NULL,
    role_id int NOT NULL,
    manager_id int 
);