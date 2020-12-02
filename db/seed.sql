USE employee_db;

INSERT INTO department
(name)
VALUES
('Sales'), ('Finance'), ('IT');
;

INSERT INTO role
(title,
salary,
department_id)
VALUES
('Junior Salesman',35000,9000),('Payroll Specialist',45000,9001),('Software Engineer',150000,9002);

INSERT INTO employee
(first_name,
last_name,
role_id,
manager_id)
VALUES
('Jorge','Hernandez',8002,null),
('Misty','Smith',8001,1),
('Doug','Boateng',8000,2),
('Elliot','Page',8002,1);
