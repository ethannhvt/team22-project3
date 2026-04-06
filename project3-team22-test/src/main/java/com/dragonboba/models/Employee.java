package com.dragonboba.models;

public class Employee {
    private int employeeId;
    private String name;
    private String role;
    private String email;
    private String status;

    public Employee(int employeeId, String name, String role, String email, String status) {
        this.employeeId = employeeId;
        this.name = name;
        this.role = role;
        this.email = email;
        this.status = status;
    }

    public int getEmployeeId() { return employeeId; }
    public String getName() { return name; }
    public String getRole() { return role; }
    public String getEmail() { return email; }
    public String getStatus() { return status; }
}