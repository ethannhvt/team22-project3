package com.dragonboba.database;

import com.dragonboba.models.InventoryItem;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class InventoryDAO {

    public static List<InventoryItem> getAllInventory() {
        List<InventoryItem> items = new ArrayList<>();
        Connection conn = DatabaseManager.getConnection();
        if (conn == null) return items;

        String query = "SELECT inventory_item_id, item_name, current_quantity, minimum_amount, unit, supplier_id FROM inventory ORDER BY inventory_item_id";
        
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(query)) {
            while (rs.next()) {
                items.add(new InventoryItem(
                    rs.getInt("inventory_item_id"),
                    rs.getString("item_name"),
                    rs.getBigDecimal("current_quantity").doubleValue(),
                    rs.getBigDecimal("minimum_amount").doubleValue(),
                    rs.getString("unit"),
                    rs.getInt("supplier_id")
                ));
            }
        } catch (SQLException e) {
            System.err.println("Error loading inventory: " + e.getMessage());
        }
        return items;
    }

    public static boolean addInventoryItem(String name, double qty, double min, String unit, int supplierId) {
        Connection conn = DatabaseManager.getConnection();
        if (conn == null) return false;

        try {
            int nextId = 1;
            try (Statement s = conn.createStatement();
                 ResultSet r = s.executeQuery("SELECT COALESCE(MAX(inventory_item_id), 0) + 1 FROM inventory")) {
                if (r.next()) nextId = r.getInt(1);
            }

            String sql = "INSERT INTO inventory (inventory_item_id, item_name, current_quantity, minimum_amount, unit, last_updated, supplier_id) VALUES (?, ?, ?, ?, ?, NOW(), ?)";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setInt(1, nextId);
                ps.setString(2, name);
                ps.setBigDecimal(3, new java.math.BigDecimal(qty));
                ps.setBigDecimal(4, new java.math.BigDecimal(min));
                ps.setString(5, unit);
                ps.setInt(6, supplierId);
                ps.executeUpdate();
                return true;
            }
        } catch (SQLException e) {
            System.err.println("Error adding inventory: " + e.getMessage());
            return false;
        }
    }
    
    public static boolean deleteInventoryItem(int id) {
        Connection conn = DatabaseManager.getConnection();
        if (conn == null) return false;
        
        try (PreparedStatement ps = conn.prepareStatement("DELETE FROM inventory WHERE inventory_item_id = ?")) {
            ps.setInt(1, id);
            ps.executeUpdate();
            return true;
        } catch (SQLException e) {
            System.err.println("Error deleting inventory (May be tied to a recipe): " + e.getMessage());
            return false;
        }
    }
}