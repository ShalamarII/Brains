XTRN = Guest Accounts (Cannot prove who you are)
ABON = Normal Library Accounts (Can prove who you are)


1. Identity / SSO
	Goal: WiseEvents uses Keycloak redirect-based authentication (No Drupal-local login for Patrons, just Staff)	
		Task: Return URLS are validated/allowlisted to prevent open redirect vulnerabilities
		Task: (Works across environments with appropriate Keycloak redirect URI configuration)
		Task: After auth, users should return to original deep-link/ position in workflow.
	 
2. Registration Ownership
	Spike: [Does Wise support creation/ use of Non-Member (XTRN)]
	Spike (Wise Team): [How Wise XTRN provisions accounts into Keycloak]
	Task: When registered, patron accounts need to be given Keycloak credentials


	Task: XTRN Registration fields are configurable.
	Task: Frame XTRN registrations as guest

3. 
	