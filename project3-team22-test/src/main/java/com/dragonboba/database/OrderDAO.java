package com.dragonboba.database;

import com.dragonboba.models.CartItem;
import java.sql.*;
import java.util.List;

public class OrderDAO {

    // handles the transaction of submitting an order and all its items
    public static boolean submitOrder(List<CartItem> cartItems, double cartTotal, int employeeId,
            String paymentMethod) {
        Connection conn = DatabaseManager.getConnection();
        if (conn == null || cartItems.isEmpty())
            return false;

        double tax = cartTotal * 0.0825;
        double total = cartTotal + tax;

        try {
            // get next order_id
            int nextOrderId = 1;
            try (Statement s = conn.createStatement();
                    ResultSet r = s.executeQuery("SELECT COALESCE(MAX(order_id), 0) + 1 FROM \"Order\"")) {
                if (r.next())
                    nextOrderId = r.getInt(1);
            }

            // insert into Order table
            String orderSql = "INSERT INTO \"Order\" (order_id, created_at, employee_id, status, subtotal, tax, total, payment_method) VALUES (?, NOW(), ?, 'Completed', ?, ?, ?, ?)";
            try (PreparedStatement ps = conn.prepareStatement(orderSql)) {
                ps.setInt(1, nextOrderId);
                ps.setInt(2, employeeId);
                ps.setBigDecimal(3, new java.math.BigDecimal(cartTotal));
                ps.setBigDecimal(4, new java.math.BigDecimal(tax));
                ps.setBigDecimal(5, new java.math.BigDecimal(total));
                ps.setString(6, paymentMethod);
                ps.executeUpdate();
            }

            // get next order_item_id
            int nextItemId = 1;
            try (Statement s = conn.createStatement();
                    ResultSet r = s.executeQuery("SELECT COALESCE(MAX(order_item_id), 0) + 1 FROM order_items")) {
                if (r.next())
                    nextItemId = r.getInt(1);
            }

            // insert each cart item
            String itemSql = "INSERT INTO order_items (order_item_id, order_id, menu_item_id, quantity, unit_price_at_sale, milk_mod, ice_mod, sweetness_mod, line_total) VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?)";
            try (PreparedStatement ps = conn.prepareStatement(itemSql)) {
                for (CartItem item : cartItems) {
                    ps.setInt(1, nextItemId++);
                    ps.setInt(2, nextOrderId);
                    ps.setInt(3, item.getMenuItem().getId());

                    // The base drink price without addons
                    double baseDrinkPrice = item.getMenuItem().getPrice();
                    ps.setBigDecimal(4, new java.math.BigDecimal(baseDrinkPrice));
                    ps.setString(5, item.getTopping());
                    ps.setString(6, item.getIceLevel());
                    ps.setString(7, item.getSugarLevel());
                    ps.setBigDecimal(8, new java.math.BigDecimal(baseDrinkPrice));
                    ps.executeUpdate();

                    // Deduct inventory for the base drink recipe
                    deductInventoryForMenuItem(conn, item.getMenuItem().getId());

                    // Insert Topping as a separate Order_Item if not "None"
                    if (!"None".equals(item.getTopping())) {
                        int toppingMenuId = getAddonMenuId(item.getTopping());
                        if (toppingMenuId > 0) {
                            insertAddonItem(conn, nextItemId++, nextOrderId, toppingMenuId);
                            deductInventoryForMenuItem(conn, toppingMenuId);
                        }
                    }
                }
            }
            return true;
        } catch (SQLException ex) {
            System.err.println("Checkout DB Error: " + ex.getMessage());
            return false;
        }
    }

    /**
     * Deducts inventory for all ingredients in a menu item's recipe.
     * Looks up recipe_ingredient for the given menu_item_id and subtracts
     * amount_required from each inventory item's current_quantity.
     */
    private static void deductInventoryForMenuItem(Connection conn, int menuItemId) throws SQLException {
        String sql = "UPDATE inventory SET current_quantity = current_quantity - ri.amount_required, last_updated = NOW() "
                +
                "FROM recipe r " +
                "JOIN recipe_ingredient ri ON r.recipe_id = ri.recipe_id " +
                "WHERE r.menu_item_id = ? AND inventory.inventory_item_id = ri.inventory_item_id";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, menuItemId);
            ps.executeUpdate();
        }
    }

    // Helper method to map the UI dropdown string to the exact Menu Item ID for
    // Add-ons
    private static int getAddonMenuId(String dropdownValue) {
        if (dropdownValue == null)
            return -1;
        if (dropdownValue.contains("Boba"))
            return 100;
        if (dropdownValue.contains("Lychee Jelly"))
            return 101;
        if (dropdownValue.contains("Pudding"))
            return 102;
        if (dropdownValue.contains("Mango"))
            return 103;
        if (dropdownValue.contains("Strawberry"))
            return 104;
        if (dropdownValue.contains("Peach"))
            return 105;
        if (dropdownValue.contains("Taro"))
            return 106;
        return -1;
    }

    // Helper method to insert an add-on as its own order item
    private static void insertAddonItem(Connection conn, int orderItemId, int orderId, int menuId) throws SQLException {
        String sql = "INSERT INTO order_items (order_item_id, order_id, menu_item_id, quantity, unit_price_at_sale, line_total) VALUES (?, ?, ?, 1, 0.50, 0.50)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, orderItemId);
            ps.setInt(2, orderId);
            ps.setInt(3, menuId);
            ps.executeUpdate();
        }
    }
}