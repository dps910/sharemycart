import app from 'firebase/app'

const DELAY_BEFORE_TYPING = Cypress.env('CY_DELAY_BEFORE_TYPING') || 100

Cypress.Commands.add('createShoppingItemParsingName', ({ name }) => {
	cy
		.get('[data-test=create-item] [data-test=input-name] input')
		.wait(DELAY_BEFORE_TYPING) // there seems to be weird re-rendering, TODO: Check why this is cleared 
		.click()
		.type(name)
		.get('[data-test=btn-create-item]').click()
})

Cypress.Commands.add('createShoppingItemStructured', ({ name, quantity, unit }) => {
	cy
		.get('[data-test=create-item] [data-test=input-name] input')
		.wait(DELAY_BEFORE_TYPING) // there seems to be weird re-rendering, TODO: Check why this is cleared 
		.click()
		.type(name)

	cy
		.get('[data-test=create-item] [data-test=input-quantity] input')
		.wait(DELAY_BEFORE_TYPING)
		.click()
		.type(quantity)

	cy
		.get('[data-test=create-item] [data-test=select-unit]')
		.click()

	cy
		.get('.alert-radio-label')
		.contains('l')
		.click()
	
		cy.get('button.alert-button').contains('OK').click()

	cy.get('[data-test=btn-create-item]').click()
})

Cypress.Commands.add('deleteShoppingItem', ({ name }) => {
	cy
		.get('[data-test=label-item-name]')
		.contains(name)
		.wait(DELAY_BEFORE_CHANGE) // there seems to be weird re-rendering, TODO: Check why this is cleared 
		.get('[data-test=btn-delete-item]')
		.click()
})

// this is a fixture which sets up the database
Cypress.Commands.add('ensureCurrentSingleShoppingList', () => {
	cy.callFirestore('get', 'lists', { userId: Cypress.env('TEST_UID') })
		.then(lists => {
			return Promise.all(
				(lists || []).map(list => {
					return cy.callFirestore('delete', `lists/${list.id}`)
				}))
		})
		.then(() => {
			cy.callFirestore('add', 'lists', {
				name: 'Automated test list',
				userId: Cypress.env('TEST_UID'),
				type: 'shopping',
				isCurrent: true,
				lifecycleStatus: 'open',
				createdAt: app.firestore.Timestamp.fromDate(new Date())
			}, null)
		})
})