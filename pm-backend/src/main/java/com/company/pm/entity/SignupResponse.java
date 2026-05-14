package com.company.pm.entity;

public class SignupResponse {
    private String id;
    private String name;
    private String designation;

    public SignupResponse(String id, String name, String designation)
    {
        this.id=id;
        this.name=name;
        this.designation=designation;
    }
    public String getId()
    {
        return id;
    }
    public String getName()
    {
        return name;
    }
    public String getDesignation()
    {
        return designation;
    }
}
