package com.dragonboba.ui.panels;

import com.dragonboba.ui.AppFrame;
import com.dragonboba.models.MenuItem;
import com.dragonboba.models.CartItem;
import com.dragonboba.database.MenuDAO;
import com.dragonboba.database.OrderDAO;

import javax.swing.*;
import java.awt.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public class CashierPanel extends JPanel {
    private AppFrame appFrame;
    private List<MenuItem> fullMenu;
    private List<CartItem> cartItems = new ArrayList<>();
    private double cartTotal = 0.0;

    private CardLayout centerCardLayout;
    private JPanel centerPanel;
    private JPanel categoryPanel;
    private JPanel itemsPanel;
    private JPanel customizationPanel;

    private JTextArea orderArea;
    private JLabel cartTotalLabel;

    // Customization UI Components
    private MenuItem currentItem;
    private JLabel itemTotalLabel;
    private JComboBox<String> sugarBox;
    private JComboBox<String> iceBox;
    private JComboBox<String> toppingBox;

    public CashierPanel(AppFrame appFrame) {
        this.appFrame = appFrame;
        setLayout(new BorderLayout());

        fullMenu = MenuDAO.getAllMenuItems();

        // 1. Order Summary Sidebar
        JPanel orderPanel = createOrderSidebar();
        add(orderPanel, BorderLayout.EAST);

        // 2. Center Panel (Categories -> Items -> Customize)
        centerCardLayout = new CardLayout();
        centerPanel = new JPanel(centerCardLayout);

        categoryPanel = new JPanel(new GridLayout(0, 3, 10, 10));
        categoryPanel.setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));

        itemsPanel = new JPanel(new GridLayout(0, 3, 10, 10));
        itemsPanel.setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));

        customizationPanel = buildCustomizationPanel();

        centerPanel.add(categoryPanel, "CATEGORIES");
        centerPanel.add(itemsPanel, "ITEMS");
        centerPanel.add(customizationPanel, "CUSTOMIZE");

        add(centerPanel, BorderLayout.CENTER);

        loadCategories();
    }

    private JPanel createOrderSidebar() {
        JPanel orderPanel = new JPanel(new BorderLayout());
        orderPanel.setPreferredSize(new Dimension(300, 0));
        orderPanel.setBorder(BorderFactory.createTitledBorder("Current Order"));

        orderArea = new JTextArea();
        orderArea.setEditable(false);
        orderPanel.add(new JScrollPane(orderArea), BorderLayout.CENTER);

        JPanel bottomPanel = new JPanel(new BorderLayout());
        cartTotalLabel = new JLabel("Total: $0.00", SwingConstants.RIGHT);
        cartTotalLabel.setFont(new Font("Arial", Font.BOLD, 20));
        cartTotalLabel.setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));
        bottomPanel.add(cartTotalLabel, BorderLayout.NORTH);

        JButton checkoutBtn = new JButton("Check-Out");
        checkoutBtn.setBackground(Color.GREEN);
        checkoutBtn.addActionListener(e -> processCheckout());

        JButton logoutBtn = new JButton("Log Out");
        logoutBtn.setBackground(new Color(255, 102, 102));
        logoutBtn.addActionListener(e -> {
            clearCart();
            appFrame.navigateTo("LOGIN");
        });

        JPanel btnPanel = new JPanel(new GridLayout(2, 1, 5, 5));
        btnPanel.add(checkoutBtn);
        btnPanel.add(logoutBtn);
        bottomPanel.add(btnPanel, BorderLayout.SOUTH);

        orderPanel.add(bottomPanel, BorderLayout.SOUTH);
        return orderPanel;
    }

    /**
     * Public method so AppFrame can trigger a menu refresh when navigating to
     * CASHIER.
     */
    public void refreshMenu() {
        loadCategories();
    }

    private void loadCategories() {
        // Re-fetch from database so newly added items appear without restarting
        fullMenu = MenuDAO.getAllMenuItems();

        categoryPanel.removeAll();
        Set<String> categories = fullMenu.stream()
                .map(MenuItem::getCategory)
                .filter(c -> !"Add-on".equals(c))
                .collect(Collectors.toSet());

        // Always ensure "Seasonal Items" appears as a category
        categories.add("Seasonal");

        for (String category : categories) {
            JButton catBtn = new JButton(category);
            catBtn.setFont(new Font("Arial", Font.BOLD, 16));
            catBtn.addActionListener(e -> loadItemsForCategory(category));
            categoryPanel.add(catBtn);
        }
        categoryPanel.revalidate();
        categoryPanel.repaint();
        centerCardLayout.show(centerPanel, "CATEGORIES");
    }

    private void loadItemsForCategory(String category) {
        itemsPanel.removeAll();
        JButton backBtn = new JButton("<- Back");
        backBtn.setBackground(Color.LIGHT_GRAY);
        backBtn.addActionListener(e -> centerCardLayout.show(centerPanel, "CATEGORIES"));
        itemsPanel.add(backBtn);

        for (MenuItem item : fullMenu) {
            if (item.getCategory().equals(category)) {
                JButton itemBtn = new JButton(
                        String.format("<html><center>%s<br>$%.2f</center></html>", item.getName(), item.getPrice()));
                itemBtn.setFont(new Font("Arial", Font.PLAIN, 14));
                itemBtn.addActionListener(e -> {
                    // Set the current item and update the customization screen
                    currentItem = item;
                    itemTotalLabel.setText(String.format("Item Total: $%.2f", currentItem.getPrice()));

                    // Reset dropdowns to defaults
                    sugarBox.setSelectedIndex(4); // 100%
                    iceBox.setSelectedIndex(2); // Regular Ice
                    toppingBox.setSelectedIndex(0); // None

                    centerCardLayout.show(centerPanel, "CUSTOMIZE");
                });
                itemsPanel.add(itemBtn);
            }
        }
        itemsPanel.revalidate();
        itemsPanel.repaint();
        centerCardLayout.show(centerPanel, "ITEMS");
    }

    private JPanel buildCustomizationPanel() {
        JPanel panel = new JPanel();
        panel.setLayout(new BoxLayout(panel, BoxLayout.Y_AXIS));
        panel.setBorder(BorderFactory.createEmptyBorder(20, 20, 20, 20));

        JLabel customTitle = new JLabel("Customize Drink");
        customTitle.setFont(new Font("Arial", Font.BOLD, 24));
        customTitle.setAlignmentX(Component.CENTER_ALIGNMENT);

        String[] sugarLevels = { "0%", "25%", "50%", "75%", "100%" };
        sugarBox = new JComboBox<>(sugarLevels);

        String[] iceLevels = { "No Ice", "Less Ice", "Regular Ice", "Extra Ice" };
        iceBox = new JComboBox<>(iceLevels);

        String[] toppings = { "None", "Boba (+$0.50)", "Lychee Jelly (+$0.50)", "Pudding (+$0.50)" };
        toppingBox = new JComboBox<>(toppings);

        itemTotalLabel = new JLabel("Item Total: $0.00");
        itemTotalLabel.setFont(new Font("Arial", Font.BOLD, 18));
        itemTotalLabel.setAlignmentX(Component.CENTER_ALIGNMENT);

        // Update total when toppings change
        toppingBox.addActionListener(e -> {
            if (currentItem != null) {
                double p = currentItem.getPrice();
                if (toppingBox.getSelectedIndex() > 0)
                    p += 0.50;
                itemTotalLabel.setText(String.format("Item Total: $%.2f", p));
            }
        });

        panel.add(customTitle);
        panel.add(Box.createRigidArea(new Dimension(0, 20)));
        panel.add(new JLabel("Sugar Level:"));
        panel.add(sugarBox);
        panel.add(Box.createRigidArea(new Dimension(0, 10)));
        panel.add(new JLabel("Ice Level:"));
        panel.add(iceBox);
        panel.add(Box.createRigidArea(new Dimension(0, 10)));
        panel.add(new JLabel("Topping:"));
        panel.add(toppingBox);
        panel.add(Box.createRigidArea(new Dimension(0, 20)));
        panel.add(itemTotalLabel);

        JPanel actionButtonPanel = new JPanel(new FlowLayout());
        JButton goBackBtn = new JButton("Go Back");
        JButton addToCartBtn = new JButton("Add to Cart");

        goBackBtn.addActionListener(e -> centerCardLayout.show(centerPanel, "ITEMS"));

        addToCartBtn.addActionListener(e -> {
            double finalPrice = currentItem.getPrice();
            if (toppingBox.getSelectedIndex() > 0)
                finalPrice += 0.50;

            String sugar = sugarBox.getSelectedItem().toString();
            String ice = iceBox.getSelectedItem().toString();
            String topping = toppingBox.getSelectedItem().toString();

            // Store structured data using the CartItem model
            CartItem newCartItem = new CartItem(currentItem, finalPrice, sugar, ice, topping);
            cartItems.add(newCartItem);

            cartTotal += finalPrice;
            cartTotalLabel.setText(String.format("Total: $%.2f", cartTotal));

            orderArea.append(String.format("%s - $%.2f\n  - %s Sugar\n  - %s\n  - %s\n\n",
                    currentItem.getName(), finalPrice, sugar, ice, topping));

            centerCardLayout.show(centerPanel, "CATEGORIES");
        });

        actionButtonPanel.add(goBackBtn);
        actionButtonPanel.add(addToCartBtn);
        panel.add(actionButtonPanel);

        return panel;
    }

    private void processCheckout() {
        if (cartItems.isEmpty()) {
            JOptionPane.showMessageDialog(this, "Cart is empty! Add items first.");
            return;
        }

        // Ask for payment method
        String[] methods = { "Cash", "Credit", "Debit" };
        String paymentMethod = (String) JOptionPane.showInputDialog(this,
                "Select payment method:", "Payment Method",
                JOptionPane.QUESTION_MESSAGE, null, methods, methods[0]);
        if (paymentMethod == null)
            return; // user cancelled

        int employeeId = appFrame.getLoggedInEmployeeId();

        // Submits to the database via OrderDAO
        boolean success = OrderDAO.submitOrder(cartItems, cartTotal, employeeId, paymentMethod);

        if (success) {
            JOptionPane.showMessageDialog(this, "Order placed successfully!");
            clearCart();
        } else {
            JOptionPane.showMessageDialog(this, "Error placing order. Check database connection.");
        }
    }

    private void clearCart() {
        cartItems.clear();
        cartTotal = 0.0;
        cartTotalLabel.setText("Total: $0.00");
        orderArea.setText("");
        centerCardLayout.show(centerPanel, "CATEGORIES");
    }
}