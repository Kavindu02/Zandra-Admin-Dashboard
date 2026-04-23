const pool = require('./models/db');

const createTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payroll (
        id INT PRIMARY KEY AUTO_INCREMENT,
        employeeId INT,
        employeeName VARCHAR(255),
        payrollMonth VARCHAR(20),
        payrollDate DATE,
        paymentMethod VARCHAR(50),
        basicSalary DECIMAL(15,2),
        allowances DECIMAL(15,2),
        overtime DECIMAL(15,2),
        bonuses DECIMAL(15,2),
        manualDeductions DECIMAL(15,2),
        taxDeduction DECIMAL(15,2),
        gross DECIMAL(15,2),
        epfEmp DECIMAL(15,2),
        epfEmpr DECIMAL(15,2),
        etf DECIMAL(15,2),
        totalDeductions DECIMAL(15,2),
        netSalary DECIMAL(15,2),
        paymentStatus VARCHAR(20),
        notes TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Payroll table created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating payroll table:', error);
    process.exit(1);
  }
};

createTable();
