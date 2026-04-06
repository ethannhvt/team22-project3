package com.dragonboba.ui.panels;

import javax.swing.*;
import javax.swing.table.DefaultTableModel;
import java.awt.*;
import java.sql.*;

/**
 * Menu Item Management Panel: Provides the ability to add new seasonal menu
 * items
 * (with recipe builder), update prices, and remove items from the POS menu.
 */
public class MenuItemPanel extends JPanel {
    private Connection conn;
    private DefaultTableModel menuTableModel;

    public MenuItemPanel(Connection conn) {
        this.conn = conn;
        setLayout(new BorderLayout());

        menuTableModel = new DefaultTableModel(new String[] { "ID", "Name", "Category", "Price" }, 0);
        JTable menuTable = new JTable(menuTableModel);
        add(new JScrollPane(menuTable), BorderLayout.CENTER);

        JPanel menuFormPanel = new JPanel(new FlowLayout());
        JTextField nameField = new JTextField(10);
        JTextField catField = new JTextField(10);
        JTextField priceField = new JTextField(5);
        menuFormPanel.add(new JLabel("Name:"));
        menuFormPanel.add(nameField);
        menuFormPanel.add(new JLabel("Category:"));
        menuFormPanel.add(catField);
        menuFormPanel.add(new JLabel("Price: $"));
        menuFormPanel.add(priceField);

        JButton addMenuBtn = new JButton("Add New Item");
        addMenuBtn.addActionListener(e -> {
            try {
                String name = nameField.getText().trim();
                String cat = catField.getText().trim();
                double price = Double.parseDouble(priceField.getText().trim());

                if (name.isEmpty() || cat.isEmpty()) {
                    JOptionPane.showMessageDialog(this, "Name and Category are required.");
                    return;
                }

                // Get next menu_item_id
                int nextId = 1;
                try (Statement s = conn.createStatement();
                        ResultSet r = s.executeQuery("SELECT COALESCE(MAX(menu_item_id), 0) + 1 FROM menu")) {
                    if (r.next())
                        nextId = r.getInt(1);
                }

                // Insert the menu item
                String sql = "INSERT INTO menu (menu_item_id, item_name, category, price, cost_basis, active_flag) VALUES (?, ?, ?, ?, ?, ?)";
                try (PreparedStatement ps = conn.prepareStatement(sql)) {
                    ps.setInt(1, nextId);
                    ps.setString(2, name);
                    ps.setString(3, cat);
                    ps.setBigDecimal(4, new java.math.BigDecimal(price));
                    ps.setBigDecimal(5, new java.math.BigDecimal("0.00"));
                    ps.setBoolean(6, true);
                    ps.executeUpdate();
                }

                // Create a recipe for this menu item
                int nextRecipeId = 1;
                try (Statement s = conn.createStatement();
                        ResultSet r = s.executeQuery("SELECT COALESCE(MAX(recipe_id), 0) + 1 FROM recipe")) {
                    if (r.next())
                        nextRecipeId = r.getInt(1);
                }
                try (PreparedStatement ps = conn
                        .prepareStatement("INSERT INTO recipe (recipe_id, menu_item_id, notes) VALUES (?, ?, ?)")) {
                    ps.setInt(1, nextRecipeId);
                    ps.setInt(2, nextId);
                    ps.setString(3, "Standard prep");
                    ps.executeUpdate();
                }

                // Open the recipe builder dialog
                showRecipeBuilderDialog(nextRecipeId, name);

                refreshMenuFromDB();
                nameField.setText("");
                catField.setText("");
                priceField.setText("");
                JOptionPane.showMessageDialog(this, "'" + name + "' added to Menu with recipe!");
            } catch (Exception ex) {
                JOptionPane.showMessageDialog(this, "Error: " + ex.getMessage());
            }
        });

        JButton updateMenuBtn = new JButton("Update Selected Price");
        updateMenuBtn.addActionListener(e -> {
            int selectedRow = menuTable.getSelectedRow();
            if (selectedRow < 0)
                return;
            try {
                double newPrice = Double.parseDouble(priceField.getText().trim());
                int menuItemId = (int) menuTableModel.getValueAt(selectedRow, 0);
                try (PreparedStatement ps = conn.prepareStatement("UPDATE menu SET price = ? WHERE menu_item_id = ?")) {
                    ps.setDouble(1, newPrice);
                    ps.setInt(2, menuItemId);
                    ps.executeUpdate();
                }
                refreshMenuFromDB();
                priceField.setText("");
            } catch (Exception ex) {
                JOptionPane.showMessageDialog(this, "Error: " + ex.getMessage());
            }
        });

        JButton removeMenuBtn = new JButton("Remove Selected Item");
        removeMenuBtn.setBackground(new Color(255, 102, 102));
        removeMenuBtn.addActionListener(e -> {
            int selectedRow = menuTable.getSelectedRow();
            if (selectedRow < 0)
                return;
            int menuItemId = (int) menuTableModel.getValueAt(selectedRow, 0);
            try {
                conn.prepareStatement(
                        "DELETE FROM recipe_ingredient WHERE recipe_id IN (SELECT recipe_id FROM recipe WHERE menu_item_id = "
                                + menuItemId + ")")
                        .executeUpdate();
                conn.prepareStatement("DELETE FROM recipe WHERE menu_item_id = " + menuItemId).executeUpdate();
                conn.prepareStatement("DELETE FROM order_items WHERE menu_item_id = " + menuItemId).executeUpdate();
                conn.prepareStatement("DELETE FROM menu WHERE menu_item_id = " + menuItemId).executeUpdate();
                refreshMenuFromDB();
            } catch (Exception ex) {
                JOptionPane.showMessageDialog(this, "Error: " + ex.getMessage());
            }
        });

        menuFormPanel.add(addMenuBtn);
        menuFormPanel.add(updateMenuBtn);
        menuFormPanel.add(removeMenuBtn);
        add(menuFormPanel, BorderLayout.SOUTH);

        // Load initial data
        refreshMenuFromDB();
    }

    /** Refreshes the menu table from the database. */
    public void refreshMenuFromDB() {
        menuTableModel.setRowCount(0);
        if (conn == null)
            return;
        try (Statement stmt = conn.createStatement();
                ResultSet rs = stmt.executeQuery(
                        "SELECT menu_item_id, item_name, category, price FROM menu ORDER BY menu_item_id")) {
            while (rs.next())
                menuTableModel.addRow(new Object[] { rs.getInt("menu_item_id"), rs.getString("item_name"),
                        rs.getString("category"), rs.getDouble("price") });
        } catch (SQLException ignored) {
        }
    }

    /**
     * Opens a dialog to let the manager associate inventory ingredients with a new
     * menu item's recipe. Each inventory item is shown with a checkbox and an
     * amount field.
     */
    private void showRecipeBuilderDialog(int recipeId, String menuItemName) {
        JDialog dialog = new JDialog((Frame) SwingUtilities.getWindowAncestor(this), "Recipe Builder: " + menuItemName,
                true);
        dialog.setLayout(new BorderLayout());
        dialog.setSize(550, 550);
        dialog.setLocationRelativeTo(this);

        JLabel header = new JLabel("Select ingredients for " + menuItemName, SwingConstants.CENTER);
        header.setFont(new Font("Arial", Font.BOLD, 16));
        header.setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));
        dialog.add(header, BorderLayout.NORTH);

        // Load all inventory items
        JPanel ingredientListPanel = new JPanel();
        ingredientListPanel.setLayout(new BoxLayout(ingredientListPanel, BoxLayout.Y_AXIS));
        ingredientListPanel.setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));

        java.util.List<JCheckBox> checkBoxes = new java.util.ArrayList<>();
        java.util.List<JTextField> amountFields = new java.util.ArrayList<>();
        java.util.List<Integer> inventoryIds = new java.util.ArrayList<>();
        java.util.List<String> units = new java.util.ArrayList<>();

        try (Statement stmt = conn.createStatement();
                ResultSet rs = stmt
                        .executeQuery("SELECT inventory_item_id, item_name, unit FROM inventory ORDER BY item_name")) {
            while (rs.next()) {
                addIngredientRow(ingredientListPanel, checkBoxes, amountFields, inventoryIds, units,
                        rs.getInt("inventory_item_id"), rs.getString("item_name"), rs.getString("unit"));
            }
        } catch (SQLException ex) {
            JOptionPane.showMessageDialog(dialog, "Error loading inventory: " + ex.getMessage());
        }

        JScrollPane scrollPane = new JScrollPane(ingredientListPanel);
        dialog.add(scrollPane, BorderLayout.CENTER);

        // Bottom panel with Add New Ingredient + Save Recipe
        JPanel bottomPanel = new JPanel(new BorderLayout());

        // --- Add New Ingredient button ---
        JButton addIngredientBtn = new JButton("+ Add New Ingredient");
        addIngredientBtn.addActionListener(ev -> {
            JTextField newNameField = new JTextField(12);
            JTextField newUnitField = new JTextField(6);
            JTextField newQtyField = new JTextField("5000", 6);
            JTextField newMinField = new JTextField("1000", 6);

            JPanel inputPanel = new JPanel(new GridLayout(4, 2, 5, 5));
            inputPanel.add(new JLabel("Ingredient Name:"));
            inputPanel.add(newNameField);
            inputPanel.add(new JLabel("Unit (g, ml, count):"));
            inputPanel.add(newUnitField);
            inputPanel.add(new JLabel("Starting Quantity:"));
            inputPanel.add(newQtyField);
            inputPanel.add(new JLabel("Minimum Amount:"));
            inputPanel.add(newMinField);

            int result = JOptionPane.showConfirmDialog(dialog, inputPanel,
                    "New Inventory Ingredient", JOptionPane.OK_CANCEL_OPTION, JOptionPane.PLAIN_MESSAGE);

            if (result == JOptionPane.OK_OPTION) {
                try {
                    String newName = newNameField.getText().trim();
                    String newUnit = newUnitField.getText().trim();
                    double newQty = Double.parseDouble(newQtyField.getText().trim());
                    double newMin = Double.parseDouble(newMinField.getText().trim());

                    if (newName.isEmpty() || newUnit.isEmpty()) {
                        JOptionPane.showMessageDialog(dialog, "Name and Unit are required.");
                        return;
                    }

                    // Get next inventory ID
                    int newInvId = 1;
                    try (Statement s = conn.createStatement();
                            ResultSet r = s
                                    .executeQuery("SELECT COALESCE(MAX(inventory_item_id), 0) + 1 FROM inventory")) {
                        if (r.next())
                            newInvId = r.getInt(1);
                    }

                    // Insert into inventory
                    String sql = "INSERT INTO inventory (inventory_item_id, item_name, current_quantity, minimum_amount, unit, last_updated, supplier_id) VALUES (?, ?, ?, ?, ?, NOW(), NULL)";
                    try (PreparedStatement ps = conn.prepareStatement(sql)) {
                        ps.setInt(1, newInvId);
                        ps.setString(2, newName);
                        ps.setBigDecimal(3, new java.math.BigDecimal(newQty));
                        ps.setBigDecimal(4, new java.math.BigDecimal(newMin));
                        ps.setString(5, newUnit);
                        ps.executeUpdate();
                    }

                    // Add to the ingredient list in the dialog (pre-checked)
                    addIngredientRow(ingredientListPanel, checkBoxes, amountFields, inventoryIds, units,
                            newInvId, newName, newUnit);
                    checkBoxes.get(checkBoxes.size() - 1).setSelected(true);
                    amountFields.get(amountFields.size() - 1).setEnabled(true);

                    ingredientListPanel.revalidate();
                    ingredientListPanel.repaint();

                    JOptionPane.showMessageDialog(dialog, "'" + newName + "' added to inventory!");
                } catch (Exception ex) {
                    JOptionPane.showMessageDialog(dialog, "Error: " + ex.getMessage());
                }
            }
        });
        bottomPanel.add(addIngredientBtn, BorderLayout.NORTH);

        // --- Save Recipe button ---
        JButton saveBtn = new JButton("Save Recipe");
        saveBtn.addActionListener(ev -> {
            try {
                int ingredientsAdded = 0;
                for (int i = 0; i < checkBoxes.size(); i++) {
                    if (checkBoxes.get(i).isSelected()) {
                        double amount = Double.parseDouble(amountFields.get(i).getText().trim());
                        if (amount <= 0)
                            continue;

                        String sql = "INSERT INTO recipe_ingredient (recipe_id, inventory_item_id, amount_required, unit) VALUES (?, ?, ?, ?)";
                        try (PreparedStatement ps = conn.prepareStatement(sql)) {
                            ps.setInt(1, recipeId);
                            ps.setInt(2, inventoryIds.get(i));
                            ps.setBigDecimal(3, new java.math.BigDecimal(amount));
                            ps.setString(4, units.get(i));
                            ps.executeUpdate();
                            ingredientsAdded++;
                        }
                    }
                }
                JOptionPane.showMessageDialog(dialog, ingredientsAdded + " ingredient(s) linked to recipe.");
                dialog.dispose();
            } catch (Exception ex) {
                JOptionPane.showMessageDialog(dialog, "Error saving recipe: " + ex.getMessage());
            }
        });

        JPanel saveBtnPanel = new JPanel(new FlowLayout());
        saveBtnPanel.add(saveBtn);
        bottomPanel.add(saveBtnPanel, BorderLayout.SOUTH);

        dialog.add(bottomPanel, BorderLayout.SOUTH);
        dialog.setVisible(true);
    }

    /**
     * Helper: adds a single ingredient row (checkbox + amount field) to the recipe
     * builder panel.
     */
    private void addIngredientRow(JPanel panel, java.util.List<JCheckBox> checkBoxes,
            java.util.List<JTextField> amountFields, java.util.List<Integer> inventoryIds,
            java.util.List<String> units, int invId, String invName, String unit) {
        JPanel row = new JPanel(new FlowLayout(FlowLayout.LEFT));
        JCheckBox cb = new JCheckBox(invName + " (" + unit + ")");
        JTextField amtField = new JTextField("0", 6);
        amtField.setEnabled(false);
        cb.addActionListener(ev -> amtField.setEnabled(cb.isSelected()));
        row.add(cb);
        row.add(new JLabel("Amount:"));
        row.add(amtField);
        panel.add(row);
        checkBoxes.add(cb);
        amountFields.add(amtField);
        inventoryIds.add(invId);
        units.add(unit);
    }
}
