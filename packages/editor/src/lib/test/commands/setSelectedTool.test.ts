import { TestApp } from '../TestApp'

let app: TestApp

beforeEach(() => {
	app = new TestApp()
})

afterEach(() => {
	app?.dispose()
})

describe('Set selected tool', () => {
	it('Selects a tool by its name', () => {
		app.setSelectedTool('hand')
		app.expectPathToBe('root.hand.idle')
	})

	it('Selects a tool by its deep path', () => {
		app.setSelectedTool('hand.pointing')
		app.expectPathToBe('root.hand.pointing')
	})
})
