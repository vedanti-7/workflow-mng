describe('Profile Changes - API Tests', () => {

  // ── Replace with a real employee from your DB ─────────────────────────────
  const empId = 'emp_tina12';
  // ──────────────────────────────────────────────────────────────────────────

  // ── 1. Fetch employee profile ─────────────────────────────────────────────
  it('should fetch employee profile from backend', () => {
    cy.request({
      method: 'GET',
      url: `http://localhost:8080/employees/${empId}`,
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.id).to.eq(empId);
      expect(res.body.name).to.exist;
      expect(res.body.designation).to.exist;
      cy.log(`Profile: ${res.body.name} | ${res.body.designation}`);
    });
  });

  // ── 2. Update name ────────────────────────────────────────────────────────
  it('should update employee name', () => {
    cy.request({
      method: 'PUT',
      url: `http://localhost:8080/employees/${empId}`,
      body: { name: 'Tina Shah Updated' },
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.name).to.eq('Tina Shah Updated');
      cy.log('Name updated ✓');
    });
  });

  // ── 3. Update designation ─────────────────────────────────────────────────
  it('should update employee designation', () => {
    cy.request({
      method: 'PUT',
      url: `http://localhost:8080/employees/${empId}`,
      body: { designation: 'Senior Backend Developer' },
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.designation).to.eq('Senior Backend Developer');
      cy.log('Designation updated ✓');
    });
  });

  // ── 4. Update email ───────────────────────────────────────────────────────
  it('should update employee email', () => {
    cy.request({
      method: 'PUT',
      url: `http://localhost:8080/employees/${empId}`,
      body: { email: 'tina.updated@gmail.com' },
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.email).to.eq('tina.updated@gmail.com');
      cy.log('Email updated ✓');
    });
  });

  // ── 5. Update employment type ─────────────────────────────────────────────
  it('should update employment type', () => {
    cy.request({
      method: 'PUT',
      url: `http://localhost:8080/employees/${empId}`,
      body: { employmentType: 'Full-Time' },
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.employmentType).to.eq('Full-Time');
      cy.log('Employment type updated ✓');
    });
  });

  // ── 6. Changes persist after re-fetch ────────────────────────────────────
  it('should persist changes after re-fetching profile', () => {
    cy.request({
      method: 'GET',
      url: `http://localhost:8080/employees/${empId}`,
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.designation).to.eq('Senior Backend Developer');
      expect(res.body.email).to.eq('tina.updated@gmail.com');
      cy.log('Changes persisted ✓');
    });
  });

  // ── 7. Non-existent employee returns 404 ─────────────────────────────────
  it('should return 404 for non-existent employee', () => {
    cy.request({
      method: 'GET',
      url: 'http://localhost:8080/employees/emp_ghost999',
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(404);
      cy.log('Non-existent employee correctly returns 404 ✓');
    });
  });

  // ── 8. Restore original values ────────────────────────────────────────────
  it('should restore original profile values', () => {
    cy.request({
      method: 'PUT',
      url: `http://localhost:8080/employees/${empId}`,
      body: { name: 'Tina Shah', designation: 'Backend Developer' },
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(200);
      cy.log('Original values restored ✓');
    });
  });

});
