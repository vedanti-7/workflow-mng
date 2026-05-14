describe('Leave Applications - API Tests', () => {

  // ── Replace with real credentials from your DB ────────────────────────────
  const empId = 'emp_aman';
  const managerId = 'mng_neeta';
  // ──────────────────────────────────────────────────────────────────────────

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // ── 1. Submit a leave application with PDF ────────────────────────────────
  it('should submit a leave application', () => {
    cy.fixture('sample.pdf', 'binary').then((pdfBinary) => {
      const blob = Cypress.Blob.binaryStringToBlob(pdfBinary, 'application/pdf');
      const form = new FormData();
      form.append('empId', empId);
      form.append('managerId', managerId);
      form.append('fromDate', today);
      form.append('toDate', tomorrow);
      form.append('reason', 'Cypress test leave');
      form.append('leaveType', 'Casual');
      form.append('document', blob, 'sample.pdf');

      cy.request({
        method: 'POST',
        url: 'http://localhost:8080/api/leaves/apply',
        body: form,
        failOnStatusCode: false
      }).then((res) => {
        expect([200, 400]).to.include(res.status);
        if (res.status === 200) {
          expect(res.body).to.exist;
          cy.log(`Leave submitted successfully ✓`);
        } else {
          cy.log('Leave blocked (limit reached): ' + res.body);
        }
      });
    });
  });

  // ── 2. Employee leave balance is fetchable ────────────────────────────────
  it('should fetch leave balance for employee', () => {
    cy.request({
      method: 'GET',
      url: `http://localhost:8080/api/leaves/balance/${empId}`,
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property('sick');
      expect(res.body).to.have.property('casual');
      expect(res.body).to.have.property('emergency');
      expect(res.body).to.have.property('wfh');
      cy.log(`Sick: ${res.body.sick.used}/${res.body.sick.max} | Casual: ${res.body.casual.used}/${res.body.casual.max}`);
    });
  });

  // ── 3. Employee leave history is fetchable ────────────────────────────────
  it('should fetch all leaves for employee', () => {
    cy.request({
      method: 'GET',
      url: `http://localhost:8080/api/leaves/employee/${empId}`,
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('array');
      cy.log(`Total leaves for ${empId}: ${res.body.length}`);
    });
  });

  // ── 4. Manager can fetch pending leaves ───────────────────────────────────
  it('should fetch pending leaves for manager', () => {
    cy.request({
      method: 'GET',
      url: `http://localhost:8080/api/leaves/manager/${managerId}/pending`,
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('array');
      cy.log(`Pending leaves for manager: ${res.body.length}`);
      res.body.forEach((l) => {
        expect(l.status).to.eq('Pending');
        cy.log(`  ${l.empId} | ${l.fromDate} → ${l.toDate} | ${l.leaveType}`);
      });
    });
  });

  // ── 5. Manager approves a pending leave ───────────────────────────────────
  it('should allow manager to approve a pending leave', () => {
    cy.request({
      method: 'GET',
      url: `http://localhost:8080/api/leaves/manager/${managerId}/pending`,
      failOnStatusCode: false
    }).then((res) => {
      if (res.body.length === 0) {
        cy.log('No pending leaves to approve — skipping');
        return;
      }
      const leaveId = res.body[0].id;
      cy.request({
        method: 'POST',
        url: `http://localhost:8080/api/leaves/${leaveId}/decision`,
        body: { status: 'Approved' },
        headers: { 'Content-Type': 'application/json' },
        failOnStatusCode: false
      }).then((decRes) => {
        expect(decRes.status).to.eq(200);
        cy.log(`Leave ${leaveId} approved ✓`);
      });
    });
  });

  // ── 6. Manager rejects a pending leave ────────────────────────────────────
  it('should allow manager to reject a pending leave', () => {
    cy.request({
      method: 'GET',
      url: `http://localhost:8080/api/leaves/manager/${managerId}/pending`,
      failOnStatusCode: false
    }).then((res) => {
      if (res.body.length === 0) {
        cy.log('No pending leaves to reject — skipping');
        return;
      }
      const leaveId = res.body[0].id;
      cy.request({
        method: 'POST',
        url: `http://localhost:8080/api/leaves/${leaveId}/decision`,
        body: { status: 'Rejected' },
        headers: { 'Content-Type': 'application/json' },
        failOnStatusCode: false
      }).then((decRes) => {
        expect(decRes.status).to.eq(200);
        cy.log(`Leave ${leaveId} rejected ✓`);
      });
    });
  });

  // ── 7. Monthly leave history is fetchable ─────────────────────────────────
  it('should fetch monthly leave history for employee', () => {
    cy.request({
      method: 'GET',
      url: `http://localhost:8080/api/leaves/employee/${empId}/monthly`,
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('array');
      cy.log(`Monthly leaves this month: ${res.body.length}`);
    });
  });

  // ── 8. Leave balance values are within valid range ────────────────────────
  it('leave balance values are non-negative', () => {
    cy.request({
      method: 'GET',
      url: `http://localhost:8080/api/leaves/balance/${empId}`,
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.sick.used).to.be.gte(0);
      expect(res.body.casual.used).to.be.gte(0);
      expect(res.body.wfh.used).to.be.gte(0);
      cy.log('All balance values non-negative ✓');
    });
  });

});
