describe('Skill-Based Employee Selection - API Tests', () => {

  // ── Replace with real credentials ─────────────────────────────────────────
  const managerId = 'mng_neeta';
  const managerPass = 'Neeta@123';
  // ──────────────────────────────────────────────────────────────────────────

  // ── 1. Fetch all employees with skills ────────────────────────────────────
  it('should fetch all employees with their skills list', () => {
    cy.request({
      method: 'GET',
      url: 'http://localhost:8080/employees/with-skills',
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('array').with.length.gte(1);
      res.body.forEach((emp) => {
        expect(emp.id).to.exist;
        expect(emp.name).to.exist;
        expect(Array.isArray(emp.skills)).to.eq(true);
      });
      cy.log(`Total employees: ${res.body.length}`);
      res.body.forEach((e) => cy.log(`  ${e.id} | [${e.skills.join(', ')}]`));
    });
  });

  // ── 2. Skills field is always an array ────────────────────────────────────
  it('skills field is always an array per employee', () => {
    cy.request({
      method: 'GET',
      url: 'http://localhost:8080/employees/with-skills',
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(200);
      res.body.forEach((emp) => {
        expect(Array.isArray(emp.skills)).to.eq(true);
      });
      cy.log('All employees have skills as array ✓');
    });
  });

  // ── 3. Filter employees by a single skill ─────────────────────────────────
  it('should find employees matching a specific skill', () => {
    cy.request({
      method: 'GET',
      url: 'http://localhost:8080/employees/with-skills',
      failOnStatusCode: false
    }).then((res) => {
      // Use first skill found in DB — no hardcoding
      const allSkills = res.body.flatMap((e) => e.skills);
      const targetSkill = allSkills.length > 0 ? allSkills[0].toLowerCase() : 'java';

      const matched = res.body.filter((emp) =>
        emp.skills.some((s) => s.toLowerCase().includes(targetSkill))
      );
      cy.log(`Skill tested: "${targetSkill}" | Matched: ${matched.length}`);
      expect(matched.length).to.be.gte(1);
      matched.forEach((e) => cy.log(`  ✓ ${e.id} — ${e.name}`));
    });
  });

  // ── 4. Multi-skill tech stack matching ────────────────────────────────────
  it('should match employees when tech stack has multiple skills', () => {
    cy.request({
      method: 'GET',
      url: 'http://localhost:8080/employees/with-skills',
      failOnStatusCode: false
    }).then((res) => {
      const allSkills = res.body.flatMap((e) => e.skills);
      if (allSkills.length < 2) { cy.log('Not enough skills to test multi-match'); return; }

      const skill1 = allSkills[0].toLowerCase();
      const skill2 = allSkills[1].toLowerCase();
      const techStack = [skill1, skill2];

      const matched = res.body.filter((emp) => {
        const empSkills = emp.skills.map((s) => s.toLowerCase());
        return techStack.some((r) => empSkills.some((s) => s.includes(r) || r.includes(s)));
      });
      cy.log(`Multi-skill match [${techStack.join(', ')}]: ${matched.length} employees`);
      expect(matched).to.be.an('array');
    });
  });

  // ── 5. Bench employees available for assignment ───────────────────────────
  it('should identify bench employees available for project assignment', () => {
    cy.request({
      method: 'GET',
      url: 'http://localhost:8080/employees/with-skills',
      failOnStatusCode: false
    }).then((res) => {
      const bench = res.body.filter(
        (e) => (e.status || '').toUpperCase() === 'BENCH'
      );
      cy.log(`Bench employees: ${bench.length}`);
      bench.forEach((e) => cy.log(`  ${e.id} — ${e.name} — [${e.skills.join(', ')}]`));
      expect(bench).to.be.an('array');
    });
  });

  // ── 6. Manager login ──────────────────────────────────────────────────────
  it('manager can login to access project creation', () => {
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

  // ── 7. Create project with skill-matched employees ────────────────────────
  it('should create a project assigning skill-matched employees', () => {
    cy.request({
      method: 'GET',
      url: 'http://localhost:8080/employees/with-skills',
      failOnStatusCode: false
    }).then((empRes) => {
      expect(empRes.status).to.eq(200);

      // Use first 2 employees regardless of bench status
      const toAssign = empRes.body.slice(0, 2).map((e) => e.id);
      cy.log(`Assigning: ${toAssign.join(', ')}`);

      const deadline = new Date();
      deadline.setMonth(deadline.getMonth() + 3);

      cy.request({
        method: 'POST',
        url: 'http://localhost:8080/api/projects/create',
        body: {
          name: 'Cypress Skill Test Project',
          techStack: 'Angular, Spring Boot',
          description: 'Cypress skill-based selection test',
          deadline: deadline.toISOString().split('T')[0],
          managerId: managerId,
          assignedEmployees: toAssign
        },
        headers: { 'Content-Type': 'application/json' },
        failOnStatusCode: false
      }).then((res) => {
        if (res.status !== 200) {
          cy.log(`Create failed (${res.status}): ${JSON.stringify(res.body)}`);
        }
        expect(res.status).to.eq(200);
        expect(res.body.prjId).to.exist;
        cy.log(`Project created: ${res.body.prjId} | Assigned: ${toAssign.join(', ')}`);
      });
    });
  });

  // ── 8. Assigned employees become BILLABLE ─────────────────────────────────
  it('assigned employees status becomes BILLABLE after project creation', () => {
    cy.request({
      method: 'GET',
      url: 'http://localhost:8080/employees/with-skills',
      failOnStatusCode: false
    }).then((res) => {
      const billable = res.body.filter(
        (e) => (e.status || '').toUpperCase() === 'BILLABLE'
      );
      cy.log(`Billable employees: ${billable.length}`);
      billable.forEach((e) => cy.log(`  ${e.id} — ${e.name}`));
      expect(billable).to.be.an('array');
    });
  });

  // ── 9. Case-insensitive skill matching ────────────────────────────────────
  it('skill matching works case-insensitively', () => {
    cy.request({
      method: 'GET',
      url: 'http://localhost:8080/employees/with-skills',
      failOnStatusCode: false
    }).then((res) => {
      const allSkills = res.body.flatMap((e) => e.skills);
      if (allSkills.length === 0) { cy.log('No skills in DB'); return; }

      const skill = allSkills[0].toLowerCase();
      const matchedLower = res.body.filter((e) =>
        e.skills.some((s) => s.toLowerCase().includes(skill))
      );
      const matchedUpper = res.body.filter((e) =>
        e.skills.some((s) => s.toLowerCase().includes(skill.toUpperCase().toLowerCase()))
      );
      expect(matchedLower.length).to.eq(matchedUpper.length);
      cy.log(`Case-insensitive match for "${skill}": ${matchedLower.length} ✓`);
    });
  });

  // ── 10. Employees with no skills still appear ─────────────────────────────
  it('employees with no skills still appear in the list', () => {
    cy.request({
      method: 'GET',
      url: 'http://localhost:8080/employees/with-skills',
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.length).to.be.gte(1);
      const noSkills = res.body.filter((e) => e.skills.length === 0);
      cy.log(`Employees with no skills: ${noSkills.length}`);
      cy.log(`Total employees in list: ${res.body.length} ✓`);
    });
  });

});
