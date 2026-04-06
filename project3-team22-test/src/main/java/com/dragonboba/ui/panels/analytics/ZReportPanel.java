package com.dragonboba.ui.panels.analytics;

import javax.swing.*;
import javax.swing.table.DefaultTableModel;
import java.awt.*;
import java.sql.*;

/**
 * Z-Report: End-of-day report that shows all totals for the day and
 * then resets them to zero (marks orders as z_run = TRUE).
 * This report has side effects and should only be run once per day.
 */
public class ZReportPanel extends JPanel {
    private Connection conn;
    private DefaultTableModel summaryTableModel;
    private DefaultTableModel paymentTableModel;
    private DefaultTableModel employeeTableModel;

    public ZReportPanel(Connection conn) {
        this.conn = conn;
        setLayout(new BorderLayout());

        JButton zReportBtn = new JButton("Run & Close Out Z-Report (End of Day)");
        zReportBtn.setBackground(new Color(255, 102, 102));

        // Summary table (key-value metrics)
        summaryTableModel = new DefaultTableModel(new String[] { "Metric", "Value" }, 0);
        JTable summaryTable = new JTable(summaryTableModel);

        // Payment method breakdown table
        paymentTableModel = new DefaultTableModel(
                new String[] { "Payment Method", "Orders", "Total" }, 0);
        JTable paymentTable = new JTable(paymentTableModel);

        // Employee breakdown table
        employeeTableModel = new DefaultTableModel(
                new String[] { "Employee ID", "Employee Name", "Orders", "Revenue" }, 0);
        JTable employeeTable = new JTable(employeeTableModel);

        // Layout
        add(zReportBtn, BorderLayout.NORTH);

        JPanel tablesPanel = new JPanel(new GridLayout(3, 1, 5, 5));
        tablesPanel.setBorder(BorderFactory.createEmptyBorder(5, 5, 5, 5));

        JPanel summaryPanel = new JPanel(new BorderLayout());
        summaryPanel.setBorder(BorderFactory.createTitledBorder("Sales & Tax Summary"));
        summaryPanel.add(new JScrollPane(summaryTable), BorderLayout.CENTER);

        JPanel paymentPanel = new JPanel(new BorderLayout());
        paymentPanel.setBorder(BorderFactory.createTitledBorder("Payment Method Breakdown"));
        paymentPanel.add(new JScrollPane(paymentTable), BorderLayout.CENTER);

        JPanel employeePanel = new JPanel(new BorderLayout());
        employeePanel.setBorder(BorderFactory.createTitledBorder("Employee Order Breakdown"));
        employeePanel.add(new JScrollPane(employeeTable), BorderLayout.CENTER);

        tablesPanel.add(summaryPanel);
        tablesPanel.add(paymentPanel);
        tablesPanel.add(employeePanel);

        add(tablesPanel, BorderLayout.CENTER);

        zReportBtn.addActionListener(e -> runZReport());
    }

    private void runZReport() {
        int confirm = JOptionPane.showConfirmDialog(this,
                "Are you sure? This will zero out the X-Report for the rest of the day.", "Confirm Z-Report",
                JOptionPane.YES_NO_OPTION);
        if (confirm != JOptionPane.YES_OPTION)
            return;

        summaryTableModel.setRowCount(0);
        paymentTableModel.setRowCount(0);
        employeeTableModel.setRowCount(0);

        try {
            // Check if already run today
            boolean alreadyRun = false;
            try (Statement checkStmt = conn.createStatement();
                    ResultSet checkRs = checkStmt.executeQuery(
                            "SELECT COUNT(*) FROM \"Order\" WHERE DATE(created_at) = CURRENT_DATE AND z_run = TRUE")) {
                if (checkRs.next() && checkRs.getInt(1) > 0)
                    alreadyRun = true;
            }

            if (alreadyRun) {
                JOptionPane.showMessageDialog(this, "A Z-Report has already been processed today.");
                return;
            }

            // ── Section 1: Sales & Tax Summary ──
            String summarySql = "SELECT COUNT(o.order_id) AS total_orders, "
                    + "SUM(o.subtotal) AS sub, SUM(o.tax) AS t, SUM(o.total) AS rev, "
                    + "(SELECT COALESCE(SUM(oi.quantity), 0) FROM order_items oi "
                    + "  JOIN \"Order\" o2 ON oi.order_id = o2.order_id "
                    + "  WHERE DATE(o2.created_at) = CURRENT_DATE AND o2.z_run = FALSE) AS total_items "
                    + "FROM \"Order\" o WHERE DATE(o.created_at) = CURRENT_DATE AND o.z_run = FALSE";
            try (Statement stmt = conn.createStatement(); ResultSet rs = stmt.executeQuery(summarySql)) {
                if (rs.next()) {
                    summaryTableModel.addRow(new Object[] { "Total Orders", rs.getInt("total_orders") });
                    summaryTableModel.addRow(new Object[] { "Total Items Sold", rs.getInt("total_items") });
                    summaryTableModel.addRow(
                            new Object[] { "Total Subtotal", "$" + String.format("%.2f", rs.getDouble("sub")) });
                    summaryTableModel
                            .addRow(new Object[] { "Total Tax", "$" + String.format("%.2f", rs.getDouble("t")) });
                    summaryTableModel.addRow(
                            new Object[] { "Total Sales (Revenue)", "$" + String.format("%.2f", rs.getDouble("rev")) });
                }
            }

            // ── Section 2: Payment Method Breakdown ──
            String paymentSql = "SELECT COALESCE(payment_method, 'Cash') AS method, "
                    + "COUNT(order_id) AS num_orders, SUM(total) AS total "
                    + "FROM \"Order\" WHERE DATE(created_at) = CURRENT_DATE AND z_run = FALSE "
                    + "GROUP BY payment_method ORDER BY payment_method";
            try (Statement stmt = conn.createStatement(); ResultSet rs = stmt.executeQuery(paymentSql)) {
                while (rs.next()) {
                    paymentTableModel.addRow(new Object[] {
                            rs.getString("method"),
                            rs.getInt("num_orders"),
                            "$" + String.format("%.2f", rs.getDouble("total"))
                    });
                }
            } catch (SQLException payEx) {
                // payment_method column might not exist on older schema
                System.err.println("Payment method query note: " + payEx.getMessage());
            }

            // ── Section 3: Employee Order Breakdown ──
            String empSql = "SELECT o.employee_id, COALESCE(e.name, 'Unknown') AS emp_name, "
                    + "COUNT(o.order_id) AS num_orders, SUM(o.total) AS revenue "
                    + "FROM \"Order\" o "
                    + "LEFT JOIN employee e ON o.employee_id = e.employee_id "
                    + "WHERE DATE(o.created_at) = CURRENT_DATE AND o.z_run = FALSE "
                    + "GROUP BY o.employee_id, e.name ORDER BY o.employee_id";
            try (Statement stmt = conn.createStatement(); ResultSet rs = stmt.executeQuery(empSql)) {
                while (rs.next()) {
                    employeeTableModel.addRow(new Object[] {
                            rs.getInt("employee_id"),
                            rs.getString("emp_name"),
                            rs.getInt("num_orders"),
                            "$" + String.format("%.2f", rs.getDouble("revenue"))
                    });
                }
            }

            // ── Reset: mark all today's orders as z_run = TRUE ──
            try (Statement updateStmt = conn.createStatement()) {
                updateStmt.executeUpdate(
                        "UPDATE \"Order\" SET z_run = TRUE WHERE DATE(created_at) = CURRENT_DATE AND z_run = FALSE");
            }
            JOptionPane.showMessageDialog(this, "Z-Report generated and daily values reset.");

        } catch (SQLException ex) {
            JOptionPane.showMessageDialog(this, "Error: " + ex.getMessage());
        }
    }
}
