package com.company.pm.entity;

public class SignupRequest {
    private String id;
    private String name;
    private String password;
    private String designation;
    private String skills;

    public String getId()
    {
        return id;
    }
    public void setId(String id)
    {
        this.id=id;
    }
    public String getName()
    {
        return name;
    }
    public void setName(String name)
    {
        this.name=name;
    }
    public void setPassword(String password)
    {
        this.password=password;
    }
    public String getPassword()
    {
        return password;
    }
    public String getDesignation()
    {
        return designation;
    }
    public void setDesignation(String designation)
    {
        this.designation=designation;
    }
    public String getSkills() {
        return skills;
    }
    public void setSkills(String skills) {
        this.skills = skills;
    }

    private String email;
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
