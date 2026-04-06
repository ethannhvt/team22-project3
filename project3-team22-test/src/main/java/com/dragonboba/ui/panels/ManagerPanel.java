package com.dragonboba.ui.panels;

import com.dragonboba.ui.AppFrame;
import com.dragonboba.ui.panels.analytics.ProductUsagePanel;
import com.dragonboba.ui.panels.analytics.SalesReportPanel;
import com.dragonboba.ui.panels.analytics.XReportPanel;
import com.dragonboba.ui.panels.analytics.ZReportPanel;
import com.dragonboba.database.DatabaseManager;

import javax.swing.*;
import javax.swing.table.DefaultTableModel;
import java.awt.*;
import java.sql.*;

public class ManagerPanel extends JPanel {
    private AppFrame appFrame;
    private Connection conn;

    private DefaultTableModel inventoryTableModel;
    private DefaultTableModel employeeTableModel;
    private DefaultTableModel reportsTableModel;

    private CardLayout managerCardLayout;
    private JPanel managerCenterPanel;

    public ManagerPanel(AppFrame appFrame) {
        this.appFrame = appFrame;
        this.conn = DatabaseManager.getConnection();
        setLayout(new BorderLayout());

        // initialize Tables
        initializeTables();

        // sidebar nav
        JPanel navPanel = new JPanel(new GridLayout(9, 1, 5, 5));
        navPanel.setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));
        JButton menuBtn = new JButton("Menu");
        JButton transBtn = new JButton("Recent Transactions");
        JButton schedBtn = new JButton("Schedule");
        JButton empBtn = new JButton("Employee");
        JButton invBtn = new JButton("Inventory");
        JButton repBtn = new JButton("Reports");
        JButton analyticsBtn = new JButton("Analytics");

        navPanel.add(menuBtn);
        navPanel.add(transBtn);
        navPanel.add(schedBtn);
        navPanel.add(empBtn);
        navPanel.add(invBtn);
        navPanel.add(repBtn);
        navPanel.add(analyticsBtn);

        JButton logoutBtn = new JButton("Employee Log-In");
        logoutBtn.setBackground(new Color(255, 102, 102));
        navPanel.add(logoutBtn);
        add(navPanel, BorderLayout.WEST);

        managerCardLayout = new CardLayout();
        managerCenterPanel = new JPanel(managerCardLayout);

        // dashboard
        JPanel dashboardPanel = new JPanel(new GridLayout(2, 1, 10, 10));
        dashboardPanel.setBorder(BorderFactory.createEmptyBorder(20, 20, 20, 20));
        JLabel bestSellerLabel = new JLabel("Today's best seller is: Classic Milk Tea", SwingConstants.CENTER);
        bestSellerLabel.setFont(new Font("Arial", Font.BOLD, 24));
        JLabel salesLabel = new JLabel("Today there were 145 items sold with $856.40 in sales!", SwingConstants.CENTER);
        salesLabel.setFont(new Font("Arial", Font.BOLD, 20));
        dashboardPanel.add(bestSellerLabel);
        dashboardPanel.add(salesLabel);

        // ── Menu Management (extracted to MenuItemPanel) ──
        MenuItemPanel menuManagePanel = new MenuItemPanel(conn);

        // ── Inventory Management ──
        JPanel inventoryManagePanel = new JPanel(new BorderLayout());
        JTable invTable = new JTable(inventoryTableModel);
        inventoryManagePanel.add(new JScrollPane(invTable), BorderLayout.CENTER);

        JPanel invFormPanel = new JPanel(new FlowLayout());
        JTextField invNameField = new JTextField(8);
        JTextField invQtyField = new JTextField(5);
        JTextField invMinField = new JTextField(5);
        JTextField invUnitField = new JTextField(5);
        JTextField invSupField = new JTextField(4);

        invFormPanel.add(new JLabel("Name:"));
        invFormPanel.add(invNameField);
        invFormPanel.add(new JLabel("Qty:"));
        invFormPanel.add(invQtyField);
        invFormPanel.add(new JLabel("Min:"));
        invFormPanel.add(invMinField);
        invFormPanel.add(new JLabel("Unit:"));
        invFormPanel.add(invUnitField);
        invFormPanel.add(new JLabel("Sup ID:"));
        invFormPanel.add(invSupField);

        JButton addInvBtn = new JButton("Add New");
        addInvBtn.addActionListener(e -> {
            try {
                int nextId = 1;
                try (Statement s = conn.createStatement();
                        ResultSet r = s.executeQuery("SELECT COALESCE(MAX(inventory_item_id), 0) + 1 FROM inventory")) {
                    if (r.next())
                        nextId = r.getInt(1);
                }
                String sql = "INSERT INTO inventory (inventory_item_id, item_name, current_quantity, minimum_amount, unit, last_updated, supplier_id) VALUES (?, ?, ?, ?, ?, NOW(), ?)";
                try (PreparedStatement ps = conn.prepareStatement(sql)) {
                    ps.setInt(1, nextId);
                    ps.setString(2, invNameField.getText());
                    ps.setBigDecimal(3, new java.math.BigDecimal(invQtyField.getText()));
                    ps.setBigDecimal(4, new java.math.BigDecimal(invMinField.getText()));
                    ps.setString(5, invUnitField.getText());
                    ps.setInt(6, Integer.parseInt(invSupField.getText()));
                    ps.executeUpdate();
                }
                refreshInventoryFromDB();
            } catch (Exception ex) {
                JOptionPane.showMessageDialog(this, "Error: " + ex.getMessage());
            }
        });

        JButton removeInvBtn = new JButton("Remove Selected");
        removeInvBtn.setBackground(new Color(255, 102, 102));
        removeInvBtn.addActionListener(e -> {
            int selectedRow = invTable.getSelectedRow();
            if (selectedRow < 0)
                return;
            try {
                int invId = (int) inventoryTableModel.getValueAt(selectedRow, 0);
                try (PreparedStatement ps = conn
                        .prepareStatement("DELETE FROM inventory WHERE inventory_item_id = ?")) {
                    ps.setInt(1, invId);
                    ps.executeUpdate();
                }
                refreshInventoryFromDB();
            } catch (Exception ex) {
                JOptionPane.showMessageDialog(this, "Error: " + ex.getMessage());
            }
        });

        invFormPanel.add(addInvBtn);
        invFormPanel.add(removeInvBtn);
        inventoryManagePanel.add(invFormPanel, BorderLayout.SOUTH);

        // ── Employee Management ──
        JPanel employeeManagePanel = new JPanel(new BorderLayout());
        JTable empTable = new JTable(employeeTableModel);
        employeeManagePanel.add(new JScrollPane(empTable), BorderLayout.CENTER);

        JPanel empFormPanel = new JPanel(new FlowLayout());
        JTextField empNameField = new JTextField(10);
        JComboBox<String> roleBox = new JComboBox<>(new String[] { "Cashier", "Manager" });
        JTextField empEmailField = new JTextField(12);
        JComboBox<String> statusBox = new JComboBox<>(new String[] { "Active", "Inactive" });

        empFormPanel.add(new JLabel("Name:"));
        empFormPanel.add(empNameField);
        empFormPanel.add(new JLabel("Role:"));
        empFormPanel.add(roleBox);
        empFormPanel.add(new JLabel("Email:"));
        empFormPanel.add(empEmailField);
        empFormPanel.add(new JLabel("Status:"));
        empFormPanel.add(statusBox);

        JButton addEmpBtn = new JButton("Add Employee");
        addEmpBtn.addActionListener(e -> {
            try {
                int nextId = 1;
                try (Statement s = conn.createStatement();
                        ResultSet r = s.executeQuery("SELECT COALESCE(MAX(employee_id), 0) + 1 FROM employee")) {
                    if (r.next())
                        nextId = r.getInt(1);
                }
                String sql = "INSERT INTO employee (employee_id, name, role, username_email, status) VALUES (?, ?, ?, ?, ?)";
                try (PreparedStatement ps = conn.prepareStatement(sql)) {
                    ps.setInt(1, nextId);
                    ps.setString(2, empNameField.getText());
                    ps.setString(3, roleBox.getSelectedItem().toString());
                    ps.setString(4, empEmailField.getText());
                    ps.setString(5, statusBox.getSelectedItem().toString());
                    ps.executeUpdate();
                }
                refreshEmployeeFromDB();
            } catch (Exception ex) {
                JOptionPane.showMessageDialog(this, "Error: " + ex.getMessage());
            }
        });

        JButton removeEmpBtn = new JButton("Remove Employee");
        removeEmpBtn.addActionListener(e -> {
            int selectedRow = empTable.getSelectedRow();
            if (selectedRow < 0)
                return;
            try {
                int empId = (int) employeeTableModel.getValueAt(selectedRow, 0);
                try (PreparedStatement ps = conn.prepareStatement("DELETE FROM employee WHERE employee_id = ?")) {
                    ps.setInt(1, empId);
                    ps.executeUpdate();
                }
                refreshEmployeeFromDB();
            } catch (Exception ex) {
                JOptionPane.showMessageDialog(this, "Error: " + ex.getMessage());
            }
        });

        empFormPanel.add(addEmpBtn);
        empFormPanel.add(removeEmpBtn);
        employeeManagePanel.add(empFormPanel, BorderLayout.SOUTH);

        // ── Reports ──
        JPanel reportsManagePanel = new JPanel(new BorderLayout());
        JTable reportsTable = new JTable(reportsTableModel);
        reportsManagePanel.add(new JScrollPane(reportsTable), BorderLayout.CENTER);

        JPanel reportsFormPanel = new JPanel(new BorderLayout());
        JTextArea reportTextArea = new JTextArea(4, 40);
        JButton addReportBtn = new JButton("Add Daily Report");
        addReportBtn.addActionListener(e -> {
            try {
                int nextId = 1;
                try (Statement s = conn.createStatement();
                        ResultSet r = s.executeQuery("SELECT COALESCE(MAX(report_id), 0) + 1 FROM reports")) {
                    if (r.next())
                        nextId = r.getInt(1);
                }
                String sql = "INSERT INTO reports (report_id, report_date, message) VALUES (?, CURRENT_DATE, ?)";
                try (PreparedStatement ps = conn.prepareStatement(sql)) {
                    ps.setInt(1, nextId);
                    ps.setString(2, reportTextArea.getText());
                    ps.executeUpdate();
                }
                refreshReportsFromDB();
                reportTextArea.setText("");
            } catch (Exception ex) {
                JOptionPane.showMessageDialog(this, "Error: " + ex.getMessage());
            }
        });

        reportsFormPanel.add(new JScrollPane(reportTextArea), BorderLayout.CENTER);
        reportsFormPanel.add(addReportBtn, BorderLayout.SOUTH);
        reportsManagePanel.add(reportsFormPanel, BorderLayout.SOUTH);

        // ── Analytics (extracted to separate panel classes) ──
        JPanel analyticsManagePanel = new JPanel(new BorderLayout());
        JTabbedPane analyticsTabs = new JTabbedPane();
        analyticsTabs.addTab("Product Usage", new ProductUsagePanel(conn));
        analyticsTabs.addTab("Sales Report", new SalesReportPanel(conn));
        analyticsTabs.addTab("X-Report", new XReportPanel(conn));
        analyticsTabs.addTab("Z-Report", new ZReportPanel(conn));
        analyticsManagePanel.add(analyticsTabs, BorderLayout.CENTER);

        // wire up cards
        managerCenterPanel.add(dashboardPanel, "DASHBOARD");
        managerCenterPanel.add(menuManagePanel, "MENU_MANAGE");
        managerCenterPanel.add(inventoryManagePanel, "INVENTORY_MANAGE");
        managerCenterPanel.add(employeeManagePanel, "EMPLOYEE_MANAGE");
        managerCenterPanel.add(reportsManagePanel, "REPORTS_MANAGE");
        managerCenterPanel.add(analyticsManagePanel, "ANALYTICS_MANAGE");

        menuBtn.addActionListener(e -> managerCardLayout.show(managerCenterPanel, "MENU_MANAGE"));
        invBtn.addActionListener(e -> managerCardLayout.show(managerCenterPanel, "INVENTORY_MANAGE"));
        empBtn.addActionListener(e -> managerCardLayout.show(managerCenterPanel, "EMPLOYEE_MANAGE"));
        repBtn.addActionListener(e -> managerCardLayout.show(managerCenterPanel, "REPORTS_MANAGE"));
        analyticsBtn.addActionListener(e -> managerCardLayout.show(managerCenterPanel, "ANALYTICS_MANAGE"));
        logoutBtn.addActionListener(e -> appFrame.navigateTo("LOGIN"));
        transBtn.addActionListener(e -> managerCardLayout.show(managerCenterPanel, "DASHBOARD"));
        schedBtn.addActionListener(e -> managerCardLayout.show(managerCenterPanel, "DASHBOARD"));

        add(managerCenterPanel, BorderLayout.CENTER);
    }

    private void initializeTables() {
        inventoryTableModel = new DefaultTableModel(
                new String[] { "ID", "Item Name", "Quantity", "Min Amount", "Unit", "Last Updated", "Supplier ID" }, 0);
        employeeTableModel = new DefaultTableModel(new String[] { "Employee ID", "Name", "Role", "Email", "Status" },
                0);
        reportsTableModel = new DefaultTableModel(new String[] { "ID", "Date", "Message" }, 0);

        refreshInventoryFromDB();
        refreshEmployeeFromDB();
        refreshReportsFromDB();
    }

    private void refreshInventoryFromDB() {
        inventoryTableModel.setRowCount(0);
        if (conn == null)
            return;
        try (Statement stmt = conn.createStatement();
                ResultSet rs = stmt.executeQuery(
                        "SELECT inventory_item_id, item_name, current_quantity, minimum_amount, unit, last_updated, supplier_id FROM inventory ORDER BY inventory_item_id")) {
            while (rs.next())
                inventoryTableModel.addRow(new Object[] { rs.getInt("inventory_item_id"), rs.getString("item_name"),
                        rs.getBigDecimal("current_quantity"), rs.getBigDecimal("minimum_amount"), rs.getString("unit"),
                        rs.getTimestamp("last_updated"), rs.getInt("supplier_id") });
        } catch (SQLException ignored) {
        }
    }

    private void refreshEmployeeFromDB() {
        employeeTableModel.setRowCount(0);
        if (conn == null)
            return;
        try (Statement stmt = conn.createStatement();
                ResultSet rs = stmt.executeQuery(
                        "SELECT employee_id, name, role, username_email, status FROM employee ORDER BY employee_id")) {
            while (rs.next())
                employeeTableModel.addRow(new Object[] { rs.getInt("employee_id"), rs.getString("name"),
                        rs.getString("role"), rs.getString("username_email"), rs.getString("status") });
        } catch (SQLException ignored) {
        }
    }

    private void refreshReportsFromDB() {
        reportsTableModel.setRowCount(0);
        if (conn == null)
            return;
        try (Statement stmt = conn.createStatement();
                ResultSet rs = stmt
                        .executeQuery("SELECT report_id, report_date, message FROM reports ORDER BY report_id DESC")) {
            while (rs.next())
                reportsTableModel.addRow(
                        new Object[] { rs.getInt("report_id"), rs.getDate("report_date"), rs.getString("message") });
        } catch (SQLException ignored) {
        }
    }
}