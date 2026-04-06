package com.dragonboba.ui.panels.analytics;

import javax.swing.*;
import javax.swing.table.DefaultTableModel;
import java.awt.*;
import java.sql.*;

/**
 * X-Report: Shows sales activities per hour for the current day of operation.
 * Only includes orders not yet zeroed out by a Z-Report (z_run = FALSE).
 * This report has no side effects and can be run as often as desired.
 */
public class XReportPanel extends JPanel {
    private Connection conn;
    private DefaultTableModel hourlyTableModel;
    private DefaultTableModel paymentTableModel;

    public XReportPanel(Connection conn) {
        this.conn = conn;
        setLayout(new BorderLayout());

        JButton xReportBtn = new JButton("Run Hourly X-Report");

        // Hourly breakdown table
        hourlyTableModel = new DefaultTableModel(
                new String[] { "Hour", "Orders", "Items Sold", "Subtotal", "Tax", "Revenue" }, 0);
        JTable hourlyTable = new JTable(hourlyTableModel);

        // Payment method summary table
        paymentTableModel = new DefaultTableModel(
                new String[] { "Payment Method", "Orders", "Total" }, 0);
        JTable paymentTable = new JTable(paymentTableModel);

        // Layout: button on top, hourly table in center, payment summary at bottom
        add(xReportBtn, BorderLayout.NORTH);

        JSplitPane splitPane = new JSplitPane(JSplitPane.VERTICAL_SPLIT);
        splitPane.setResizeWeight(0.7);

        JPanel hourlyPanel = new JPanel(new BorderLayout());
        hourlyPanel.setBorder(BorderFactory.createTitledBorder("Hourly Sales Breakdown"));
        hourlyPanel.add(new JScrollPane(hourlyTable), BorderLayout.CENTER);

        JPanel paymentPanel = new JPanel(new BorderLayout());
        paymentPanel.setBorder(BorderFactory.createTitledBorder("Payment Method Summary"));
        paymentPanel.add(new JScrollPane(paymentTable), BorderLayout.CENTER);

        splitPane.setTopComponent(hourlyPanel);
        splitPane.setBottomComponent(paymentPanel);
        add(splitPane, BorderLayout.CENTER);

        xReportBtn.addActionListener(e -> runXReport());
    }

    private void runXReport() {
        hourlyTableModel.setRowCount(0);
        paymentTableModel.setRowCount(0);

        // Hourly breakdown with items sold (using subquery to avoid double-counting
        // from JOIN)
        String hourlySqlFixed = "SELECT hr, COUNT(*) AS num_orders, "
                + "SUM(items) AS items_sold, SUM(sub) AS subtotal, SUM(tx) AS tax, SUM(rev) AS revenue "
                + "FROM ( "
                + "  SELECT EXTRACT(HOUR FROM o.created_at) AS hr, "
                + "    o.order_id, o.subtotal AS sub, o.tax AS tx, o.total AS rev, "
                + "    (SELECT COALESCE(SUM(oi.quantity), 0) FROM order_items oi WHERE oi.order_id = o.order_id) AS items "
                + "  FROM \"Order\" o "
                + "  WHERE DATE(o.created_at) = CURRENT_DATE AND o.z_run = FALSE "
                + ") subq "
                + "GROUP BY hr ORDER BY hr";

        try (Statement stmt = conn.createStatement(); ResultSet rs = stmt.executeQuery(hourlySqlFixed)) {
            while (rs.next()) {
                hourlyTableModel.addRow(new Object[] {
                        rs.getInt("hr") + ":00",
                        rs.getInt("num_orders"),
                        rs.getInt("items_sold"),
                        "$" + String.format("%.2f", rs.getDouble("subtotal")),
                        "$" + String.format("%.2f", rs.getDouble("tax")),
                        "$" + String.format("%.2f", rs.getDouble("revenue"))
                });
            }
        } catch (SQLException ex) {
            if (ex.getMessage().contains("z_run")) {
                JOptionPane.showMessageDialog(this,
                        "Missing 'z_run' boolean column in 'Order' table. Please add it to enable X/Z reporting.");
            } else {
                JOptionPane.showMessageDialog(this, "Error: " + ex.getMessage());
            }
            return;
        }

        // Payment method summary
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
        } catch (SQLException ex) {
            // payment_method column might not exist yet on older data; silently skip
            System.err.println("Payment method query note: " + ex.getMessage());
        }
    }
}
