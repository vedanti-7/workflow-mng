describe('Signup Flow - Your Project', () => {

  it('should signup successfully', () => {

    cy.visit('/signup');

    cy.intercept('GET', '**/auth/check-id*').as('checkId');
    cy.intercept('POST', '**/auth/signup').as('signupReq');

    // ✅ UNIQUE ID (MAIN FIX)
    const uniqueId = 'emp_' + Date.now();

    cy.get('input[name="id"]').type(uniqueId);
    cy.get('input[name="id"]').blur();

    cy.wait('@checkId').then((interception) => {
      console.log(interception.response.body);
    });

    cy.get('input[name="name"]').type('Test User');
    cy.get('input[name="designation"]').type('Developer');
    cy.get('input[name="skills"]').type('Java, Angular');
    cy.get('input[name="email"]').type('test@test.com');
    cy.get('input[name="password"]').type('Test@123');

    cy.get('input[type="file"]').selectFile('cypress/fixtures/sample.pdf', { force: true });

    // ✅ NOW THIS WILL PASS
    cy.get('button.btn-submit').should('not.be.disabled');

    cy.get('button.btn-submit').click();

    cy.wait('@signupReq').its('response.statusCode').should('eq', 200);

  });

});