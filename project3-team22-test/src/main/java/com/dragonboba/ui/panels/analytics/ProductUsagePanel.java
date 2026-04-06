package com.dragonboba.ui.panels.analytics;

import javax.swing.*;
import javax.swing.table.DefaultTableModel;
import java.awt.*;
import java.sql.*;
import com.github.lgooddatepicker.components.DatePicker;

/**
 * Product Usage Chart: Given a time window, displays a table showing
 * the amount of each inventory ingredient used during that period.
 */
public class ProductUsagePanel extends JPanel {
    private Connection conn;
    private DefaultTableModel usageTableModel;

    public ProductUsagePanel(Connection conn) {
        this.conn = conn;
        setLayout(new BorderLayout());

        JPanel usageInputPanel = new JPanel(new FlowLayout());
        DatePicker usageStartField = new DatePicker();
        DatePicker usageEndField = new DatePicker();
        JButton usageBtn = new JButton("Generate Usage Chart");
        usageTableModel = new DefaultTableModel(new String[] { "Ingredient", "Amount Used", "Unit" }, 0);
        JTable usageTable = new JTable(usageTableModel);

        usageInputPanel.add(new JLabel("Start Date:"));
        usageInputPanel.add(usageStartField);
        usageInputPanel.add(new JLabel("End Date:"));
        usageInputPanel.add(usageEndField);
        usageInputPanel.add(usageBtn);
        add(usageInputPanel, BorderLayout.NORTH);
        add(new JScrollPane(usageTable), BorderLayout.CENTER);

        usageBtn.addActionListener(e -> {
            if (usageStartField.getDate() == null || usageEndField.getDate() == null) {
                JOptionPane.showMessageDialog(this, "Please select both start and end dates.");
                return;
            }
            usageTableModel.setRowCount(0);
            String sql = "SELECT i.item_name, SUM(oi.quantity * ri.amount_required) as amount_used, i.unit " +
                    "FROM \"Order\" o " +
                    "JOIN order_items oi ON o.order_id = oi.order_id " +
                    "JOIN recipe r ON oi.menu_item_id = r.menu_item_id " +
                    "JOIN recipe_ingredient ri ON r.recipe_id = ri.recipe_id " +
                    "JOIN inventory i ON ri.inventory_item_id = i.inventory_item_id " +
                    "WHERE DATE(o.created_at) BETWEEN ?::DATE AND ?::DATE " +
                    "GROUP BY i.item_name, i.unit";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, usageStartField.getDate().toString());
                ps.setString(2, usageEndField.getDate().toString());
                ResultSet rs = ps.executeQuery();
                while (rs.next()) {
                    usageTableModel.addRow(new Object[] { rs.getString("item_name"), rs.getDouble("amount_used"),
                            rs.getString("unit") });
                }
            } catch (SQLException ex) {
                JOptionPane.showMessageDialog(this, "Error: " + ex.getMessage());
            }
        });
    }
}
