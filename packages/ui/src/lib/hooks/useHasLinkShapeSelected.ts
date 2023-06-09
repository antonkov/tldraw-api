import { useApp } from '@tldraw/editor'
import { useValue } from 'signia-react'

export function useHasLinkShapeSelected() {
	const app = useApp()
	return useValue(
		'hasLinkShapeSelected',
		() => {
			const { selectedShapes } = app
			return (
				selectedShapes.length === 1 &&
				'url' in selectedShapes[0].props &&
				selectedShapes[0].type !== 'embed'
			)
		},
		[app]
	)
}
