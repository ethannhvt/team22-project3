package com.dragonboba.models;
import java.sql.Date;

public class Report {
    private int id;
    private Date date;
    private String message;

    public Report(int id, Date date, String message) {
        this.id = id;
        this.date = date;
        this.message = message;
    }

    public int getId() { return id; }
    public Date getDate() { return date; }
    public String getMessage() { return message; }
}