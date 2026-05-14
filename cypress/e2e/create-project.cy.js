describe('Create Project Flow', () => {

  it('should create project with skill-based employee selection', () => {

    // ✅ Simulate logged-in manager
    cy.visit('/create-project', {
      onBeforeLoad(win) {
        win.sessionStorage.setItem('userId', 'emp_manager1');
      }
    });

    // ✅ Intercepts
    cy.intercept('POST', '**/api/projects/create').as('createProject');

    // Fill Project Name
    const projectName = 'Test Project ' + Date.now();
    cy.get('input[placeholder="e.g. CRM System"]').type(projectName);

    // Fill Tech Stack (triggers filtering)
    cy.get('input[placeholder*="Angular"]').type('Angular');

    // Wait for Angular UI update
    cy.wait(500);

    // Fill Description
    cy.get('textarea').type('This is a Cypress test project');

    // Set Deadline
    cy.get('input[type="date"]').type('2026-12-31');

    // ✅ Ensure employees are visible
    cy.get('.emp-card').should('have.length.greaterThan', 0);

    // ✅ Select employees
    cy.get('.emp-card').first().click();
    cy.get('.emp-card').eq(1).click();

    // ✅ Validate selection
    cy.get('.emp-selected').should('have.length.at.least', 1);

    // Click Create Project
    cy.get('button.btn-create').click();

    // ✅ Verify API call
    cy.wait('@createProject').its('response.statusCode').should('eq', 200);

    // ✅ Verify redirect
    cy.url().should('include', '/dashboard');

  });

});