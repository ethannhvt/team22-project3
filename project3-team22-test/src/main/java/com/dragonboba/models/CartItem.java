package com.dragonboba.models;

public class CartItem {
    private MenuItem menuItem;
    private double finalPrice;
    private String sugarLevel;
    private String iceLevel;
    private String topping;

    public CartItem(MenuItem menuItem, double finalPrice, String sugarLevel, String iceLevel, String topping) {
        this.menuItem = menuItem;
        this.finalPrice = finalPrice;
        this.sugarLevel = sugarLevel;
        this.iceLevel = iceLevel;
        this.topping = topping;
    }

    public MenuItem getMenuItem() {
        return menuItem;
    }

    public double getFinalPrice() {
        return finalPrice;
    }

    public String getSugarLevel() {
        return sugarLevel;
    }

    public String getIceLevel() {
        return iceLevel;
    }

    public String getTopping() {
        return topping;
    }
}