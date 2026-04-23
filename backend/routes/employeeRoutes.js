const express = require('express');
const router = express.Router();
const employeeModel = require('../models/employeeModel');

// GET all employees
router.get('/', async (req, res) => {
  try {
    const employees = await employeeModel.getEmployees();
    res.json(employees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// POST add new employee
router.post('/', async (req, res) => {
  try {
    const id = await employeeModel.addEmployee(req.body);
    res.json({ id, message: 'Employee added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add employee' });
  }
});

// PUT update existing employee
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await employeeModel.updateEmployee(id, req.body);
    res.json({ message: 'Employee updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// DELETE employee
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await employeeModel.deleteEmployee(id);
    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

module.exports = router;
