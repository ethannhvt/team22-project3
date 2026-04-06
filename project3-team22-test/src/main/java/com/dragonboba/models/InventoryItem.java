package com.dragonboba.models;

public class InventoryItem {
    private int id;
    private String name;
    private double quantity;
    private double minAmount;
    private String unit;
    private int supplierId;

    public InventoryItem(int id, String name, double quantity, double minAmount, String unit, int supplierId) {
        this.id = id;
        this.name = name;
        this.quantity = quantity;
        this.minAmount = minAmount;
        this.unit = unit;
        this.supplierId = supplierId;
    }

    public int getId() { return id; }
    public String getName() { return name; }
    public double getQuantity() { return quantity; }
    public double getMinAmount() { return minAmount; }
    public String getUnit() { return unit; }
    public int getSupplierId() { return supplierId; }
}