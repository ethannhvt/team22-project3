package com.dragonboba.ui.panels;

import com.dragonboba.ui.AppFrame;
import com.dragonboba.database.EmployeeDAO;
import com.dragonboba.models.Employee;

import javax.swing.*;
import java.awt.*;

public class LoginPanel extends JPanel {
    private AppFrame appFrame;

    public LoginPanel(AppFrame appFrame) {
        this.appFrame = appFrame;
        setLayout(new GridBagLayout());

        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(10, 10, 10, 10);

        JLabel logoLabel = new JLabel("DRAGON BOBA", SwingConstants.CENTER);
        logoLabel.setFont(new Font("Arial", Font.BOLD, 42));
        gbc.gridx = 0;
        gbc.gridy = 0;
        gbc.gridwidth = 2;
        add(logoLabel, gbc);

        gbc.gridwidth = 1;
        gbc.gridy = 1;
        gbc.gridx = 0;
        add(new JLabel("Employee ID:"), gbc);

        JTextField empIdField = new JTextField(15);
        gbc.gridx = 1;
        add(empIdField, gbc);

        JButton loginButton = new JButton("Login");
        gbc.gridx = 0;
        gbc.gridy = 2;
        gbc.gridwidth = 2;
        add(loginButton, gbc);

        loginButton.addActionListener(e -> attemptLogin(empIdField.getText().trim()));
    }

    private void attemptLogin(String idStr) {
        if (idStr.isEmpty())
            return;

        try {
            int inputId = Integer.parseInt(idStr);

            Employee emp = EmployeeDAO.getEmployeeById(inputId);

            if (emp != null) {
                appFrame.setLoggedInEmployeeId(inputId);
                if (emp.getRole().equalsIgnoreCase("Manager")) {
                    appFrame.navigateTo("MANAGER");
                } else {
                    appFrame.navigateTo("CASHIER");
                }
            } else {
                JOptionPane.showMessageDialog(this, "Invalid Employee ID.");
            }
        } catch (NumberFormatException ex) {
            JOptionPane.showMessageDialog(this, "Please enter a numeric ID.");
        }
    }
}