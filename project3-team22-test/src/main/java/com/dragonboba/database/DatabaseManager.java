package com.dragonboba.database;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DatabaseManager {
    private static final String DB_URL = "jdbc:postgresql://team22db.cfua4csok41s.us-east-2.rds.amazonaws.com:5432/postgres";
    private static final String DB_USER = "team22";
    private static final String DB_PASS = "team22pw"; // actual password left blank

    private static Connection connection = null;

    // prevents instantiation
    private DatabaseManager() {
    }

    public static Connection getConnection() {
        if (connection == null) {
            try {
                connection = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
                System.out.println("Connected to AWS PostgreSQL database.");

                // Auto-migrate: ensure payment_method column exists
                try (java.sql.Statement migStmt = connection.createStatement()) {
                    migStmt.execute(
                            "ALTER TABLE \"Order\" ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'Cash'");
                } catch (SQLException migEx) {
                    System.err.println("Migration note: " + migEx.getMessage());
                }
            } catch (SQLException e) {
                System.err.println("Database connection failed: " + e.getMessage());
            }
        }
        return connection;
    }
}