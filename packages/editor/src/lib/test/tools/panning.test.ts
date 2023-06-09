import { TestApp } from '../TestApp'

jest.useFakeTimers()

let app: TestApp

afterEach(() => {
	app?.dispose()
})

beforeEach(() => {
	app = new TestApp()

	app.createShapes([])
})

describe('When panning with the spacebar...', () => {
	it.todo(
		'enters panning mode when spacebar is pressed, starts panning on pointer down, pans when the pointer moves, stops panning on pointer up, restores cursor on spacebar up'
	)
	it.todo(
		'does not pan when the spacebar is pressed and the ctrl (or command on mac) key is pressed'
	)
	it.todo('Stops panning when the window blurs.')
})
