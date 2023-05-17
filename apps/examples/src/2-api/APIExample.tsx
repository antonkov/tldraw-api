import { App, LABEL_FONT_SIZES, TEXT_PROPS, TLParentId, Tldraw } from '@tldraw/tldraw'
import '@tldraw/tldraw/editor.css'
import '@tldraw/tldraw/ui.css'

type Node = { text: string; id: string; name?: string; subNodes?: NodeLayer[] }
type Tactic = { text: string; fromNodeIds: string[]; dependsOnIds: string[]; toNodeIds: string[] }

type NodeLayer = Node[]

type Tree = { nodes: NodeLayer[]; tactics: Tactic[] }

const example: Tree = {
	nodes: [
		[
			{ text: 'p', name: 'hp', id: 'hp' },
			{ text: 'q', name: 'hq', id: 'hq' },
		],
		[
			{ text: 'q', id: 'q' },
			{ text: 'p', id: 'p2' },
		],
		[
			{ text: 'p', id: 'p' },
			{
				text: 'q ∧ p',
				id: 'qp',
			},
		],
		[
			{
				text: 'p ∧ q ∧ p',
				id: 'pqp',
			},
		],
	],
	tactics: [
		{ text: 'exact hq', dependsOnIds: ['hq'], fromNodeIds: [], toNodeIds: ['q'] },
		{ text: 'exact hp', dependsOnIds: ['hp'], fromNodeIds: [], toNodeIds: ['p'] },
		{ text: 'exact hp', dependsOnIds: ['hp'], fromNodeIds: [], toNodeIds: ['p2'] },
		{ text: 'apply And.intro', dependsOnIds: [], fromNodeIds: ['q', 'p2'], toNodeIds: ['qp'] },
		{ text: 'apply And.intro', dependsOnIds: [], fromNodeIds: ['q', 'qp'], toNodeIds: ['pqp'] },
	],
}

export default function Example() {
	const handleMount = (app: App) => {
		const inBetweenMargin = 20
		const framePadding = 20

		type Size = [number, number]
		const { nodes, tactics } = example

		function vStack(margin: number, ...boxes: Size[]): Size {
			const w = Math.max(...boxes.map((b) => b[0]))
			const h = boxes.map((b) => b[1]).reduce((x, y) => x + y)
			return [w, h + (boxes.length - 1) * margin]
		}

		function hStack(margin: number, ...boxes: Size[]): Size {
			const w = boxes.map((b) => b[0]).reduce((x, y) => x + y)
			const h = Math.max(...boxes.map((b) => b[1]))
			return [w + (boxes.length - 1) * margin, h]
		}

		const drawNode = (
			parentId: TLParentId | undefined,
			text: string,
			[x, y]: [number, number],
			type: 'value' | 'tactic' = 'value'
		): Size => {
			const [w, h] = getSize({ text, id: 'aa' })
			app.createShapes([
				{
					id: app.createShapeId(),
					type: 'geo',
					x,
					y,
					parentId,
					props: {
						geo: 'rectangle',
						w,
						h,
						...(type == 'value'
							? { dash: 'draw', fill: 'solid', color: 'light-green' }
							: { dash: 'dotted', fill: 'none', color: 'grey' }),
						size: 'm',
						text,
					},
				},
			])
			return [w, h]
		}

		function getTreeSize(layers: NodeLayer[]): [number, number] {
			return vStack(
				inBetweenMargin,
				...layers.map((l) => hStack(inBetweenMargin, ...l.map(getSize)))
			)
		}

		function getFrameSize(layers: NodeLayer[]): [number, number] {
			const size = getTreeSize(layers)
			return [size[0] + framePadding * 2, size[1] + framePadding * 2]
		}

		function getTextSize(text: string): [number, number] {
			const size = app.textMeasure.measureText({
				...TEXT_PROPS,
				text,
				fontFamily: 'draw',
				fontSize: LABEL_FONT_SIZES['m'],
				width: 'fit-content',
				padding: '16px',
			})
			return [
				// Don't know how to calculate size correctly yet
				size.w * 1.3,
				size.h,
			]
		}

		function getSize(node: Node): [number, number] {
			const sizes: Size[] = []
			const [toValueTactic, fromValueTactic] = getTactics(node, tactics)
			if (toValueTactic) {
				sizes.push(getTextSize(toValueTactic.text))
			}
			sizes.push(getTextSize(node.text))
			if (fromValueTactic) {
				sizes.push(getTextSize(fromValueTactic.text))
			}
			const frameSize: Size = node.subNodes ? getFrameSize(node.subNodes) : [0, 0]
			return vStack(0, frameSize, ...sizes)
		}
		app.selectAll().deleteShapes()
		// Create a shape id
		app.focus()

		function getTactics(node: Node, tactics: Tactic[]): [Tactic | undefined, Tactic | undefined] {
			const toValueTactic = tactics.find(
				(t) => t.toNodeIds.length == 1 && t.toNodeIds.includes(node.id)
			)
			const fromValueTactic = tactics.find(
				(t) => t.fromNodeIds.length == 1 && t.fromNodeIds.includes(node.id)
			)
			return [toValueTactic, fromValueTactic]
		}

		function drawNodes(
			parentId: TLParentId | undefined,
			[x0, y0]: [number, number],
			layers: NodeLayer[]
		) {
			let y = y0
			for (const layer of layers) {
				let x = x0
				for (const node of layer) {
					const sizes: Size[] = []
					let dy = 0
					const [toValueTactic, fromValueTactic] = getTactics(node, tactics)
					if (toValueTactic) {
						const size: Size = drawNode(parentId, toValueTactic.text, [x, y], 'tactic')
						sizes.push(size)
						dy += size[1]
					}
					const valueSize = drawNode(parentId, node.text, [x, y + dy])
					sizes.push(valueSize)
					dy += valueSize[1]
					if (fromValueTactic) {
						const size: Size = drawNode(parentId, fromValueTactic.text, [x, y + dy], 'tactic')
						sizes.push(size)
						dy += size[1]
					}

					x += vStack(0, ...sizes)[0] + inBetweenMargin
				}
				y += getTreeSize([layer])[1] + inBetweenMargin
			}
		}

		drawNodes(undefined, [0, 0], nodes)

		// Zoom the camera to fit both shapes
		app.zoomToFit()
	}

	return (
		<div className="tldraw__editor">
			<Tldraw persistenceKey="api-example" onMount={handleMount} autoFocus={false}></Tldraw>
		</div>
	)
}
