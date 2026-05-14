describe('Employee Login - API Tests', () => {

  // ── Replace with a real employee from your DB ─────────────────────────────
  const empId = 'emp_tina';
  const empPass = 'T@123';
  // ──────────────────────────────────────────────────────────────────────────

  // ── 1. Correct credentials return 200 ────────────────────────────────────
  it('should login with correct credentials', () => {
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
      cy.log(`Logged in: ${res.body.name} | Role: ${res.body.role}`);
    });
  });

  // ── 2. Wrong password is rejected ────────────────────────────────────────
  it('should reject wrong password', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/auth/login',
      body: { id: empId, password: 'Wrong@Pass1' },
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.not.eq(200);
      expect(res.body.message).to.include('Invalid Credentials');
      cy.log('Wrong password rejected ✓');
    });
  });

  // ── 3. Non-existent ID is rejected ───────────────────────────────────────
  it('should reject non-existent employee ID', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/auth/login',
      body: { id: 'emp_ghost999', password: empPass },
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.not.eq(200);
      expect(res.body.message).to.include('not found');
      cy.log('Non-existent ID rejected ✓');
    });
  });

  // ── 4. Response has all required fields ───────────────────────────────────
  it('should return id, name and role in response', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/auth/login',
      body: { id: empId, password: empPass },
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.all.keys('id', 'name', 'role');
      cy.log('All response fields present ✓');
    });
  });

  // ── 5. Employee ID starts with emp_ ──────────────────────────────────────
  it('should return ID with emp_ prefix', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/auth/login',
      body: { id: empId, password: empPass },
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.id).to.match(/^emp_/);
      cy.log('emp_ prefix verified ✓');
    });
  });

});
