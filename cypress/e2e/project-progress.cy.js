describe('Project Progress Feature - API Tests', () => {

  // ── Replace with real credentials from your DB ────────────────────────────
  const managerId = 'mng_neeta';
  const managerPass = 'Neeta@123';
  const empId = 'emp_tina';
  const empPass = 'T@123';
  // ──────────────────────────────────────────────────────────────────────────

  const today = new Date().toISOString().split('T')[0];

  // ── 1. Manager login ───────────────────────────────────────────────────────
  it('should login manager via API', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/auth/login',
      body: { id: managerId, password: managerPass },
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.id).to.eq(managerId);
    });
  });

  // ── 2. Manager projects list returns valid data ────────────────────────────
  it('manager projects list returns valid data', () => {
    cy.request({
      method: 'GET',
      url: `http://localhost:8080/api/projects/manager/${managerId}`,
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('array').with.length.gte(1);
      const p = res.body[0];
      expect(p.prjId).to.exist;
      expect(p.name).to.exist;
      expect(p.deadline).to.exist;
      cy.log(`Project: ${p.name} | Deadline: ${p.deadline}`);
    });
  });

  // ── 3. Project detail endpoint returns full progress data ──────────────────
  it('project detail endpoint returns assignedEmployees and updates', () => {
    cy.request({
      method: 'GET',
      url: `http://localhost:8080/api/projects/manager/${managerId}/detail`,
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('array').with.length.gte(1);
      const p = res.body[0];
      expect(p).to.have.property('assignedEmployees');
      expect(p).to.have.property('acceptedBy');
      expect(p).to.have.property('updates');
      expect(p.startDate).to.exist;
      expect(p.deadline).to.exist;
      cy.log(`Assigned: ${p.assignedEmployees} | Start: ${p.startDate} | Deadline: ${p.deadline}`);
    });
  });

  // ── 4. Employee login ──────────────────────────────────────────────────────
  it('should login employee via API', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/auth/login',
      body: { id: empId, password: empPass },
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.id).to.eq(empId);
    });
  });

  // ── 5. Employee submits a weekly update that drives progress ───────────────
  it('employee submits a weekly update with progress value', () => {
    cy.request({
      method: 'GET',
      url: `http://localhost:8080/api/projects/employee/${empId}/current`,
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.length).to.be.gte(1);
      const projectId = res.body[0].prjId;

      cy.request({
        method: 'POST',
        url: `http://localhost:8080/api/projects/${projectId}/weekly-update`,
        body: {
          empId: empId,
          date: today,
          workDone: 'Cypress: completed progress tracking module',
          progress: 75
        },
        headers: { 'Content-Type': 'application/json' },
        failOnStatusCode: false
      }).then((updateRes) => {
        expect(updateRes.status).to.eq(200);
        expect(updateRes.body.workDone).to.include('Cypress');
        expect(updateRes.body.progress).to.eq(75);
        cy.log(`Progress recorded: ${updateRes.body.progress}%`);
      });
    });
  });

  // ── 6. Weekly logs retrievable after submission ────────────────────────────
  it('weekly logs endpoint returns submitted progress entries', () => {
    cy.request({
      method: 'GET',
      url: `http://localhost:8080/api/projects/employee/${empId}/current`,
      failOnStatusCode: false
    }).then((res) => {
      const projectId = res.body[0].prjId;

      cy.request({
        method: 'GET',
        url: `http://localhost:8080/api/projects/${projectId}/weekly-logs/${empId}`,
        failOnStatusCode: false
      }).then((logsRes) => {
        expect(logsRes.status).to.eq(200);
        expect(logsRes.body).to.be.an('array').with.length.gte(1);
        const latest = logsRes.body[0];
        expect(latest.work).to.exist;
        expect(latest.date).to.exist;
        cy.log(`Latest log: ${latest.date} — ${latest.work}`);
      });
    });
  });

  // ── 7. Progress status — start/deadline exist for On Track/At Risk/Delayed ─
  it('project has valid start and deadline dates for status calculation', () => {
    cy.request({
      method: 'GET',
      url: `http://localhost:8080/api/projects/manager/${managerId}/detail`,
      failOnStatusCode: false
    }).then((res) => {
      const p = res.body[0];
      const start = new Date(p.startDate);
      const deadline = new Date(p.deadline);
      const totalDays = (deadline - start) / (1000 * 60 * 60 * 24);
      const elapsed = (new Date() - start) / (1000 * 60 * 60 * 24);
      const expectedProgress = Math.min(100, Math.round((elapsed / totalDays) * 100));
      expect(totalDays).to.be.gt(0);
      cy.log(`Expected progress by today: ${expectedProgress}%`);
    });
  });

  // ── 8. Per-employee update aggregation ────────────────────────────────────
  it('project detail updates array contains per-employee logs', () => {
    cy.request({
      method: 'GET',
      url: `http://localhost:8080/api/projects/manager/${managerId}/detail`,
      failOnStatusCode: false
    }).then((res) => {
      const p = res.body[0];
      expect(p.updates).to.be.an('array');
      p.updates.forEach((empUpdate) => {
        expect(empUpdate.employeeId).to.exist;
        expect(empUpdate.weeklyLogs).to.be.an('array');
        cy.log(`Employee ${empUpdate.employeeId}: ${empUpdate.weeklyLogs.length} log(s)`);
      });
    });
  });

  // ── 9. Reject update for non-existent project ─────────────────────────────
  it('rejects weekly update for non-existent project', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/api/projects/non-existent-prj/weekly-update',
      body: { empId: empId, date: today, workDone: 'Should not save', progress: 10 },
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.not.eq(200);
      cy.log('Correctly rejected: ' + res.status);
    });
  });

  // ── 10. Progress values are always 0–100 ──────────────────────────────────
  it('all progress values in logs are between 0 and 100', () => {
    cy.request({
      method: 'GET',
      url: `http://localhost:8080/api/projects/employee/${empId}/current`,
      failOnStatusCode: false
    }).then((res) => {
      if (res.body.length === 0) { cy.log('No projects'); return; }
      const projectId = res.body[0].prjId;

      cy.request({
        method: 'GET',
        url: `http://localhost:8080/api/projects/${projectId}/weekly-logs/${empId}`,
        failOnStatusCode: false
      }).then((logsRes) => {
        logsRes.body.forEach((log) => {
          expect(log.progress).to.be.gte(0);
          expect(log.progress).to.be.lte(100);
        });
        cy.log('All progress values valid ✓');
      });
    });
  });

});
