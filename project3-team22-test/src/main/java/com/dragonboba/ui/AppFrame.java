package com.dragonboba.ui;

import com.dragonboba.ui.panels.LoginPanel;
import com.dragonboba.ui.panels.CashierPanel;
import com.dragonboba.ui.panels.ManagerPanel;

import javax.swing.*;
import java.awt.*;

public class AppFrame extends JFrame {
    private CardLayout cardLayout;
    private JPanel mainPanel;
    private int loggedInEmployeeId = -1;
    private CashierPanel cashierPanel;

    public int getLoggedInEmployeeId() {
        return loggedInEmployeeId;
    }

    public void setLoggedInEmployeeId(int id) {
        this.loggedInEmployeeId = id;
    }

    public AppFrame() {
        setTitle("Dragon Boba POS — AWS Connected");
        setSize(1024, 768);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null);

        cardLayout = new CardLayout();
        mainPanel = new JPanel(cardLayout);

        // pass 'this' so the panels can call navigateTo()
        mainPanel.add(new LoginPanel(this), "LOGIN");

        cashierPanel = new CashierPanel(this);
        mainPanel.add(cashierPanel, "CASHIER");
        mainPanel.add(new ManagerPanel(this), "MANAGER");

        add(mainPanel);
        navigateTo("LOGIN");
    }

    public void navigateTo(String panelName) {
        if ("CASHIER".equals(panelName) && cashierPanel != null) {
            cashierPanel.refreshMenu();
        }
        cardLayout.show(mainPanel, panelName);
    }
}