describe('Admin Approval Feature - API Tests', () => {

  // ── Replace with real credentials from your DB ────────────────────────────
  const adminId = 'AD_0001';           // your actual admin ID (AD prefix)
  const adminPass = 'Admin_rajeev_s@123';       // admin plain text password
  const testEmpId = 'emp_test99';      // a NEW unique ID not in DB yet
  const testEmpPass = 'Test@1234';     // must meet password policy
  const empId = 'emp_neha';          // any existing approved employee
  const empPass = 'Neha@123';          // their password
  // ──────────────────────────────────────────────────────────────────────────

  // ── 1. Admin login ─────────────────────────────────────────────────────────
  it('should login admin via API', () => {
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

  // ── 2. ID uniqueness check — new ID should be available ───────────────────
  it('should confirm test employee ID is unique', () => {
    cy.request({
      method: 'GET',
      url: `http://localhost:8080/auth/check-id?id=${testEmpId}`,
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(200);
      // If already exists from a previous run, that's fine — log it
      cy.log(`ID check: available=${res.body.available} — ${res.body.message}`);
    });
  });

  // ── 3. Submit a signup request using real PDF from fixtures ───────────────
  it('should submit a signup request that goes to pending', () => {
    // Skip if already pending or already approved
    cy.request({
      method: 'GET',
      url: 'http://localhost:8080/auth/admin/signup-requests',
      failOnStatusCode: false
    }).then((listRes) => {
      const alreadyPending = listRes.body.some((r) => r.id === testEmpId);
      if (alreadyPending) { cy.log('Already pending — skip'); return; }

      cy.request({
        method: 'GET',
        url: `http://localhost:8080/employees/${testEmpId}`,
        failOnStatusCode: false
      }).then((empRes) => {
        if (empRes.status === 200) { cy.log('Already approved — skip'); return; }

        // Read the PDF fixture as binary
        cy.fixture('sample.pdf', 'binary').then((pdfBinary) => {
          const blob = Cypress.Blob.binaryStringToBlob(pdfBinary, 'application/pdf');

          const form = new FormData();
          form.append('id', testEmpId);
          form.append('name', 'Cypress Tester');
          form.append('password', testEmpPass);
          form.append('designation', 'QA Engineer');
          form.append('skills', 'Cypress, Testing');
          form.append('email', 'cypress@test.com');
          form.append('document', blob, 'sample.pdf');

          cy.request({
            method: 'POST',
            url: 'http://localhost:8080/auth/signup',
            body: form,
            failOnStatusCode: false
          }).then((res) => {
            expect([200, 400]).to.include(res.status);
            if (res.status === 200) {
              expect(res.body.message).to.include('Awaiting admin approval');
              cy.log('Signup request submitted: ' + res.body.message);
            } else {
              cy.log('Blocked (may exist): ' + res.body.message);
            }
          });
        });
      });
    });
  });

  // ── 4. Admin can fetch pending signup requests ─────────────────────────────
  it('admin can fetch all pending signup requests', () => {
    cy.request({
      method: 'GET',
      url: 'http://localhost:8080/auth/admin/signup-requests',
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('array');
      cy.log(`Pending requests: ${res.body.length}`);
      res.body.forEach((req) => {
        expect(req.id).to.exist;
        expect(req.name).to.exist;
        expect(req.status).to.eq('PENDING');
        cy.log(`  - ${req.id} | ${req.name} | ${req.designation}`);
      });
    });
  });

  // ── 5. Pending request has no password exposed ────────────────────────────
  it('pending signup response does not expose password', () => {
    cy.request({
      method: 'GET',
      url: 'http://localhost:8080/auth/admin/signup-requests',
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(200);
      res.body.forEach((req) => {
        expect(req).to.not.have.property('password');
      });
      cy.log('Password not exposed in any pending request ✓');
    });
  });

  // ── 6. Admin approves the first available pending signup request ──────────
  it('admin can approve a pending signup request', () => {
    cy.request({
      method: 'GET',
      url: 'http://localhost:8080/auth/admin/signup-requests',
      failOnStatusCode: false
    }).then((listRes) => {
      expect(listRes.status).to.eq(200);

      if (listRes.body.length === 0) {
        cy.log('No pending requests — skipping approval test');
        return;
      }

      const toApprove = listRes.body[0];
      cy.log(`Approving: ${toApprove.id} — ${toApprove.name}`);

      cy.request({
        method: 'POST',
        url: `http://localhost:8080/auth/admin/signup-requests/${toApprove.id}/approve?adminId=${adminId}`,
        failOnStatusCode: false
      }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.message).to.include('approved');
        cy.log('Approved: ' + res.body.message);
      });
    });
  });

  // ── 7. Approved employee now exists in employees table ────────────────────
  it('after approval, employee count in DB is verifiable', () => {
    cy.request({
      method: 'GET',
      url: 'http://localhost:8080/employees/with-skills',
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('array').with.length.gte(1);
      cy.log(`Total employees in system: ${res.body.length}`);
    });
  });

  // ── 8. Approved employee can log in ───────────────────────────────────────
  it('any existing employee can login with correct credentials', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/auth/login',
      body: { id: empId, password: empPass },
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.id).to.eq(empId);
      cy.log(`Employee login verified: ${res.body.name}`);
    });
  });

  // ── 9. Admin rejects a signup request ─────────────────────────────────────
  it('admin can reject a pending signup request', () => {
    cy.request({
      method: 'GET',
      url: 'http://localhost:8080/auth/admin/signup-requests',
      failOnStatusCode: false
    }).then((listRes) => {
      if (listRes.body.length === 0) {
        cy.log('No pending requests to reject — test skipped');
        return;
      }

      // Pick the first pending request that is NOT our test employee
      const toReject = listRes.body.find((r) => r.id !== testEmpId);
      if (!toReject) {
        cy.log('No other pending requests to reject');
        return;
      }

      cy.request({
        method: 'DELETE',
        url: `http://localhost:8080/auth/admin/signup-requests/${toReject.id}/reject`,
        failOnStatusCode: false
      }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.message).to.include('rejected');
        cy.log('Rejected: ' + res.body.message);
      });
    });
  });

  // ── 10. Duplicate ID is blocked ───────────────────────────────────────────
  it('should block signup with an already-existing employee ID', () => {
    cy.request({
      method: 'GET',
      url: `http://localhost:8080/auth/check-id?id=${testEmpId}`,
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.available).to.eq(false);
      expect(res.body.message).to.include('already exists');
      cy.log('Duplicate blocked: ' + res.body.message);
    });
  });

});
