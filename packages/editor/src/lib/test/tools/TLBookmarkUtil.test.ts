import { TLBookmarkShape } from '@tldraw/tlschema'
import {
	TLBookmarkShapeDef,
	TLBookmarkUtil,
} from '../../app/shapeutils/TLBookmarkUtil/TLBookmarkUtil'
import { TestApp } from '../TestApp'

let app: TestApp

beforeEach(() => {
	app = new TestApp()
})
afterEach(() => {
	app?.dispose()
})

describe(TLBookmarkUtil, () => {
	return
})

describe('The URL formatter', () => {
	it('Formats URLs as human-readable', () => {
		const ids = {
			a: app.createShapeId(),
			b: app.createShapeId(),
			c: app.createShapeId(),
			d: app.createShapeId(),
			e: app.createShapeId(),
			f: app.createShapeId(),
		}

		app.createShapes([
			{
				id: ids.a,
				type: 'bookmark',
				props: {
					url: 'https://www.github.com',
				},
			},
			{
				id: ids.b,
				type: 'bookmark',
				props: {
					url: 'https://www.github.com/',
				},
			},
			{
				id: ids.c,
				type: 'bookmark',
				props: {
					url: 'https://www.github.com/TodePond',
				},
			},
			{
				id: ids.d,
				type: 'bookmark',
				props: {
					url: 'https://www.github.com/TodePond/',
				},
			},
			{
				id: ids.e,
				type: 'bookmark',
				props: {
					url: 'https://www.github.com//',
				},
			},
			{
				id: ids.f,
				type: 'bookmark',
				props: {
					url: 'https://www.github.com/TodePond/DreamBerd//',
				},
			},
		])

		const a = app.getShapeById(ids.a) as TLBookmarkShape
		const b = app.getShapeById(ids.b) as TLBookmarkShape
		const c = app.getShapeById(ids.c) as TLBookmarkShape
		const d = app.getShapeById(ids.d) as TLBookmarkShape
		const e = app.getShapeById(ids.e) as TLBookmarkShape
		const f = app.getShapeById(ids.f) as TLBookmarkShape

		const util = app.getShapeUtilByDef(TLBookmarkShapeDef)
		expect(util.getHumanReadableAddress(a)).toBe('www.github.com')
		expect(util.getHumanReadableAddress(b)).toBe('www.github.com')
		expect(util.getHumanReadableAddress(c)).toBe('www.github.com/TodePond')
		expect(util.getHumanReadableAddress(d)).toBe('www.github.com/TodePond')
		expect(util.getHumanReadableAddress(e)).toBe('www.github.com')
		expect(util.getHumanReadableAddress(f)).toBe('www.github.com/TodePond/DreamBerd')
	})

	it("Doesn't resize bookmarks", () => {
		const ids = {
			bookmark: app.createShapeId(),
			boxA: app.createShapeId(),
			boxB: app.createShapeId(),
		}

		app.createShapes([
			{
				id: ids.bookmark,
				type: 'bookmark',
				props: {
					url: 'https://www.github.com/TodePond',
				},
			},
			{
				type: 'geo',
				id: ids.boxA,
				x: 0,
				y: 0,
				props: {
					w: 10,
					h: 10,
				},
			},
			{
				type: 'geo',
				id: ids.boxB,
				x: 20,
				y: 20,
				props: {
					w: 10,
					h: 10,
				},
			},
		])

		const oldBookmark = app.getShapeById(ids.bookmark) as TLBookmarkShape
		expect(oldBookmark.props.w).toBe(300)
		expect(oldBookmark.props.h).toBe(320)

		app.select(ids.bookmark, ids.boxA, ids.boxB)
		app.pointerDown(20, 20, { target: 'selection', handle: 'bottom_right' })
		app.pointerMove(30, 30)

		const newBookmark = app.getShapeById(ids.bookmark) as TLBookmarkShape
		expect(newBookmark.props.w).toBe(300)
		expect(newBookmark.props.h).toBe(320)
	})
})
