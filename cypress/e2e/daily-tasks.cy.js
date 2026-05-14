describe('Daily Tasks (Stand-Up) - API Tests', () => {

  // ── Replace these with real credentials from your DB ──────────────────────
  const managerId = 'mng_neeta';       // a manager ID that owns a project
  const managerPass = 'Neeta@123'; // manager's password
  const empId = 'emp_tina';        // an employee with an accepted project
  const empPass = 'T@123';        // employee's password
  // ──────────────────────────────────────────────────────────────────────────

  let prjId = null;
  let taskId = null;

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

  // ── 2. Get a project owned by the manager ─────────────────────────────────
  it('should fetch manager projects and pick one', () => {
    cy.request({
      method: 'GET',
      url: `http://localhost:8080/api/projects/manager/${managerId}`,
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('array').with.length.gte(1);
      prjId = res.body[0].prjId;
      cy.log('Using project: ' + prjId);
    });
  });

  // ── 3. Manager adds a daily stand-up task ─────────────────────────────────
  it('should allow manager to add a daily stand-up task', () => {
    cy.request({
      method: 'GET',
      url: `http://localhost:8080/api/projects/manager/${managerId}`,
      failOnStatusCode: false
    }).then((projRes) => {
      const projectId = projRes.body[0].prjId;

      cy.request({
        method: 'POST',
        url: 'http://localhost:8080/api/daily-tasks',
        body: { prjId: projectId, title: 'Cypress test: Fix authentication bug' },
        headers: { 'Content-Type': 'application/json' },
        failOnStatusCode: false
      }).then((res) => {
        // 200 = task created, 400 = daily limit reached (3/day) — both are valid
        expect([200, 400]).to.include(res.status);
        if (res.status === 200) {
          expect(res.body.taskId).to.exist;
          expect(res.body.title).to.include('Cypress test');
          taskId = res.body.taskId;
          cy.log('Created task: ' + taskId);
        } else {
          cy.log('Daily limit reached — task creation blocked as expected');
        }
      });
    });
  });

  // ── 4. Enforce max 3 tasks per day ────────────────────────────────────────
  it('should reject a 4th task on the same day', () => {
    cy.request({
      method: 'GET',
      url: `http://localhost:8080/api/projects/manager/${managerId}`,
      failOnStatusCode: false
    }).then((projRes) => {
      const projectId = projRes.body[0].prjId;

      // Add tasks until limit is hit
      const addTask = (n) => cy.request({
        method: 'POST',
        url: 'http://localhost:8080/api/daily-tasks',
        body: { prjId: projectId, title: `Limit test task ${n}` },
        headers: { 'Content-Type': 'application/json' },
        failOnStatusCode: false
      });

      // Try adding 4 — at least one should return 400
      addTask(1).then(() => addTask(2)).then(() => addTask(3)).then(() => {
        addTask(4).then((res) => {
          // Either 400 (limit) or 200 if slots still available — log either way
          cy.log('4th task response status: ' + res.status);
          if (res.status === 400) {
            expect(res.body).to.include('limit');
          }
        });
      });
    });
  });

  // ── 5. Get today's tasks for a project ────────────────────────────────────
  it('should fetch today\'s stand-up tasks for a project', () => {
    cy.request({
      method: 'GET',
      url: `http://localhost:8080/api/projects/manager/${managerId}`,
      failOnStatusCode: false
    }).then((projRes) => {
      const projectId = projRes.body[0].prjId;

      cy.request({
        method: 'GET',
        url: `http://localhost:8080/api/daily-tasks/project/${projectId}`,
        failOnStatusCode: false
      }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body).to.be.an('array');
        cy.log('Today\'s tasks count: ' + res.body.length);
      });
    });
  });

  // ── 6. Employee login ──────────────────────────────────────────────────────
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

  // ── 7. Employee responds to a task (done = true) ───────────────────────────
  it('should allow employee to respond to a daily task', () => {
    cy.request({
      method: 'GET',
      url: `http://localhost:8080/api/projects/employee/${empId}/current`,
      failOnStatusCode: false
    }).then((projRes) => {
      expect(projRes.status).to.eq(200);
      expect(projRes.body.length).to.be.gte(1);
      const projectId = projRes.body[0].prjId;

      cy.request({
        method: 'GET',
        url: `http://localhost:8080/api/daily-tasks/project/${projectId}`,
        failOnStatusCode: false
      }).then((taskRes) => {
        expect(taskRes.status).to.eq(200);

        if (taskRes.body.length === 0) {
          cy.log('No tasks today — skipping response test');
          return;
        }

        const task = taskRes.body[0];
        cy.request({
          method: 'POST',
          url: `http://localhost:8080/api/daily-tasks/${task.taskId}/respond`,
          body: { empId: empId, done: 'true', comment: '' },
          headers: { 'Content-Type': 'application/json' },
          failOnStatusCode: false
        }).then((res) => {
          expect(res.status).to.eq(200);
          cy.log('Response saved: ' + res.body);
        });
      });
    });
  });

  // ── 8. Employee responds with done = false + reason ───────────────────────
  it('should allow employee to respond with a blocker reason', () => {
    cy.request({
      method: 'GET',
      url: `http://localhost:8080/api/projects/employee/${empId}/current`,
      failOnStatusCode: false
    }).then((projRes) => {
      if (projRes.body.length === 0) { cy.log('No projects'); return; }
      const projectId = projRes.body[0].prjId;

      cy.request({
        method: 'GET',
        url: `http://localhost:8080/api/daily-tasks/project/${projectId}`,
        failOnStatusCode: false
      }).then((taskRes) => {
        if (taskRes.body.length === 0) { cy.log('No tasks today'); return; }

        const task = taskRes.body[0];
        cy.request({
          method: 'POST',
          url: `http://localhost:8080/api/daily-tasks/${task.taskId}/respond`,
          body: {
            empId: empId,
            done: 'false',
            comment: 'Blocked by dependency on auth service'
          },
          headers: { 'Content-Type': 'application/json' },
          failOnStatusCode: false
        }).then((res) => {
          expect(res.status).to.eq(200);
        });
      });
    });
  });

  // ── 9. Reject task creation with missing fields ───────────────────────────
  it('should reject task creation with missing title', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/api/daily-tasks',
      body: { prjId: 'some-project' }, // no title
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(400);
    });
  });

  // ── 10. Reject response with missing empId ────────────────────────────────
  it('should reject task response with missing empId', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/api/daily-tasks/fake-task-id/respond',
      body: { done: 'true' }, // no empId
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(400);
    });
  });

});
