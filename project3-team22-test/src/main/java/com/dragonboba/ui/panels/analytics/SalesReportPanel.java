package com.dragonboba.ui.panels.analytics;

import javax.swing.*;
import javax.swing.table.DefaultTableModel;
import java.awt.*;
import java.sql.*;
import com.github.lgooddatepicker.components.DatePicker;

/**
 * Sales Report: Given a time window, displays the sales by item
 * from the order history (quantity sold and total revenue per item).
 */
public class SalesReportPanel extends JPanel {
    private Connection conn;
    private DefaultTableModel salesTableModel;

    public SalesReportPanel(Connection conn) {
        this.conn = conn;
        setLayout(new BorderLayout());

        JPanel salesInputPanel = new JPanel(new FlowLayout());
        DatePicker salesStartField = new DatePicker();
        DatePicker salesEndField = new DatePicker();
        JButton salesBtn = new JButton("Generate Sales Report");
        salesTableModel = new DefaultTableModel(
                new String[] { "Menu Item", "Quantity Sold", "Total Revenue" }, 0);
        JTable salesTable = new JTable(salesTableModel);

        salesInputPanel.add(new JLabel("Start Date:"));
        salesInputPanel.add(salesStartField);
        salesInputPanel.add(new JLabel("End Date:"));
        salesInputPanel.add(salesEndField);
        salesInputPanel.add(salesBtn);
        add(salesInputPanel, BorderLayout.NORTH);
        add(new JScrollPane(salesTable), BorderLayout.CENTER);

        salesBtn.addActionListener(e -> {
            if (salesStartField.getDate() == null || salesEndField.getDate() == null) {
                JOptionPane.showMessageDialog(this, "Please select both start and end dates.");
                return;
            }
            salesTableModel.setRowCount(0);
            String sql = "SELECT m.item_name, SUM(oi.quantity) as qty, SUM(oi.line_total) as revenue " +
                    "FROM \"Order\" o " +
                    "JOIN order_items oi ON o.order_id = oi.order_id " +
                    "JOIN menu m ON oi.menu_item_id = m.menu_item_id " +
                    "WHERE DATE(o.created_at) BETWEEN ?::DATE AND ?::DATE " +
                    "GROUP BY m.item_name";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, salesStartField.getDate().toString());
                ps.setString(2, salesEndField.getDate().toString());
                ResultSet rs = ps.executeQuery();
                while (rs.next()) {
                    salesTableModel.addRow(new Object[] { rs.getString("item_name"), rs.getInt("qty"),
                            "$" + String.format("%.2f", rs.getDouble("revenue")) });
                }
            } catch (SQLException ex) {
                JOptionPane.showMessageDialog(this, "Error: " + ex.getMessage());
            }
        });
    }
}
