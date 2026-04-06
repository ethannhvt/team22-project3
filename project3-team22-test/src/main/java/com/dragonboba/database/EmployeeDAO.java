package com.dragonboba.database;

import com.dragonboba.models.Employee;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class EmployeeDAO {
    
    public static Employee getEmployeeById(int id) {
        Connection conn = DatabaseManager.getConnection();
        if (conn == null) return null;

        String query = "SELECT employee_id, name, role, username_email, status FROM employee WHERE employee_id = ?";
        
        try (PreparedStatement pstmt = conn.prepareStatement(query)) {
            pstmt.setInt(1, id);
            ResultSet rs = pstmt.executeQuery();
            
            if (rs.next()) {
                return new Employee(
                    rs.getInt("employee_id"),
                    rs.getString("name"),
                    rs.getString("role"),
                    rs.getString("username_email"),
                    rs.getString("status")
                );
            }
        } catch (SQLException e) {
            System.err.println("Error fetching employee: " + e.getMessage());
        }
        return null;
    }
}