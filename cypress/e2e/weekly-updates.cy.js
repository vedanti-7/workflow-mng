describe('Weekly Updates - API Tests', () => {

  const empId = 'emp_tina';       // replace with your actual emp_ ID
  const password = 'Tto @123';    // replace with actual password
  const today = new Date().toISOString().split('T')[0];
  let prjId = null;

  // Step 1: Login and get employee info
  it('should login employee via API', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/auth/login',
      body: { id: empId, password: password },
      headers: { 'Content-Type': 'application/json' }
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.id).to.eq(empId);
      expect(res.body.name).to.exist;
    });
  });

  // Step 2: Employee exists in DB
  it('should fetch employee profile from backend', () => {
    cy.request({
      method: 'GET',
      url: `http://localhost:8080/employees/${empId}`
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.id).to.eq(empId);
      expect(res.body.designation).to.exist;
    });
  });

  // Step 3: Employee has accepted projects
  it('should have at least one current project', () => {
    cy.request({
      method: 'GET',
      url: `http://localhost:8080/api/projects/employee/${empId}/current`
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.be.gte(1);
      prjId = res.body[0].prjId;
      cy.wrap(prjId).as('prjId');
    });
  });

  // Step 4: Submit a weekly update
  it('should submit a weekly update to backend', () => {
    // First get the project
    cy.request({
      method: 'GET',
      url: `http://localhost:8080/api/projects/employee/${empId}/current`
    }).then((res) => {
      expect(res.body.length).to.be.gte(1);
      const projectId = res.body[0].prjId;

      cy.request({
        method: 'POST',
        url: `http://localhost:8080/api/projects/${projectId}/weekly-update`,
        body: {
          empId: empId,
          date: today,
          workDone: 'Cypress test: completed login module and unit tests',
          progress: 60
        },
        headers: { 'Content-Type': 'application/json' }
      }).then((updateRes) => {
        expect(updateRes.status).to.eq(200);
        expect(updateRes.body.empId).to.eq(empId);
        expect(updateRes.body.workDone).to.include('Cypress test');
      });
    });
  });

  // Step 5: Verify the update was saved
  it('should retrieve weekly logs for the employee', () => {
    cy.request({
      method: 'GET',
      url: `http://localhost:8080/api/projects/employee/${empId}/current`
    }).then((res) => {
      const projectId = res.body[0].prjId;

      cy.request({
        method: 'GET',
        url: `http://localhost:8080/api/projects/${projectId}/weekly-logs/${empId}`
      }).then((logsRes) => {
        expect(logsRes.status).to.eq(200);
        expect(logsRes.body).to.be.an('array');
        expect(logsRes.body.length).to.be.gte(1);
        expect(logsRes.body[0].work).to.exist;
      });
    });
  });

  // Step 6: Leave balance check (related employee data)
  it('should fetch leave balance for employee', () => {
    cy.request({
      method: 'GET',
      url: `http://localhost:8080/api/leaves/balance/${empId}`
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.sick).to.exist;
      expect(res.body.casual).to.exist;
    });
  });

});
