package com.dragonboba.database;

import com.dragonboba.models.MenuItem;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class MenuDAO {
    
    //fetches all menu items to populate the Cashier and Manager screens
    public static List<MenuItem> getAllMenuItems() {
        List<MenuItem> items = new ArrayList<>();
        Connection conn = DatabaseManager.getConnection();
        if (conn == null) return items;

        String query = "SELECT menu_item_id, item_name, category, price FROM menu ORDER BY menu_item_id";
        
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(query)) {
            while (rs.next()) {
                items.add(new MenuItem(
                    rs.getInt("menu_item_id"),
                    rs.getString("item_name"),
                    rs.getString("category"),
                    rs.getDouble("price")
                ));
            }
        } catch (SQLException e) {
            System.err.println("Could not load menu: " + e.getMessage());
        }
        return items;
    }
}