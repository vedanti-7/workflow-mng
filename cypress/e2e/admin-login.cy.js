describe('Login Feature - API Tests', () => {

  // ── Replace with real credentials from your DB ────────────────────────────
  const empId = 'emp_tina12';
  const empPass = 'Tina@123';
  const managerId = 'mng_001';
  const managerPass = 'Manager@123';
  const adminId = 'AD_0001';
  const adminPass = 'Admin_rajeev_s@123';
  // ──────────────────────────────────────────────────────────────────────────

  // ── 1. Employee login succeeds ────────────────────────────────────────────
  it('employee login returns 200 with correct credentials', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/auth/login',
      body: { id: empId, password: empPass },
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.id).to.eq(empId);
      expect(res.body.name).to.exist;
      expect(res.body.role).to.exist;
      cy.log(`Employee logged in: ${res.body.name} | Role: ${res.body.role}`);
    });
  });

  // ── 2. Manager login succeeds ─────────────────────────────────────────────
  it('manager login returns 200 with correct credentials', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/auth/login',
      body: { id: managerId, password: managerPass },
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.id).to.eq(managerId);
      cy.log(`Manager logged in: ${res.body.name}`);
    });
  });

  // ── 3. Admin login succeeds ───────────────────────────────────────────────
  it('admin login returns 200 with correct credentials', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/auth/login',
      body: { id: adminId, password: adminPass },
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.id).to.eq(adminId);
      expect(res.body.role).to.eq('Administrator');
      cy.log(`Admin logged in: ${res.body.name}`);
    });
  });

  // ── 4. Wrong password returns error ──────────────────────────────────────
  it('login fails with wrong password', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/auth/login',
      body: { id: empId, password: 'WrongPass@999' },
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.not.eq(200);
      expect(res.body.message).to.include('Invalid Credentials');
      cy.log('Wrong password correctly rejected ✓');
    });
  });

  // ── 5. Non-existent user returns error ────────────────────────────────────
  it('login fails for non-existent user ID', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/auth/login',
      body: { id: 'emp_doesnotexist', password: 'Any@Pass1' },
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.not.eq(200);
      expect(res.body.message).to.include('not found');
      cy.log('Non-existent user correctly rejected ✓');
    });
  });

  // ── 6. Login response contains required fields ────────────────────────────
  it('login response contains id, name and role fields', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/auth/login',
      body: { id: empId, password: empPass },
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property('id');
      expect(res.body).to.have.property('name');
      expect(res.body).to.have.property('role');
      cy.log(`Response fields verified: id=${res.body.id}, role=${res.body.role}`);
    });
  });

  // ── 7. Employee ID prefix is emp_ ─────────────────────────────────────────
  it('employee login response ID starts with emp_', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/auth/login',
      body: { id: empId, password: empPass },
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.id).to.match(/^emp_/);
      cy.log('Employee ID prefix verified ✓');
    });
  });

  // ── 8. Admin ID prefix is AD ──────────────────────────────────────────────
  it('admin login response ID starts with AD', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/auth/login',
      body: { id: adminId, password: adminPass },
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.id).to.match(/^AD/);
      cy.log('Admin ID prefix verified ✓');
    });
  });

  // ── 9. Empty credentials rejected ────────────────────────────────────────
  it('login fails with empty credentials', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/auth/login',
      body: { id: '', password: '' },
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.not.eq(200);
      cy.log('Empty credentials correctly rejected ✓');
    });
  });

  // ── 10. Login is case-sensitive for password ──────────────────────────────
  it('login fails when password case is wrong', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/auth/login',
      body: { id: empId, password: empPass.toLowerCase() },
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false
    }).then((res) => {
      // Lowercase version of a BCrypt password should fail
      expect(res.status).to.not.eq(200);
      cy.log('Password case sensitivity verified ✓');
    });
  });

});
