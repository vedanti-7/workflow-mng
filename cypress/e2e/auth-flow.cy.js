describe('My Angular + Spring Boot App', () => {

  it('successfully loads the home page', () => {
    // This looks at your baseUrl (localhost:4200) automatically
    cy.visit('/'); 
    
    // Check if a specific text exists on your page to confirm it loaded
    // Change 'Login' to whatever text is actually on your screen
    cy.contains('Login').should('be.visible'); 
  });

  it('should navigate to the resource page', () => {
    cy.visit('/resources'); // Change this to a real route in your Angular app
    
    // This checks if your Spring Boot data populated a list or table
    cy.get('table').should('exist');
  });

});