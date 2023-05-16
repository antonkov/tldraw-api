import { App, LABEL_FONT_SIZES, TEXT_PROPS, TLParentId, Tldraw } from '@tldraw/tldraw'
import '@tldraw/tldraw/editor.css'
import '@tldraw/tldraw/ui.css'

// The tldraw component shares its App instance via its onMount callback prop.

// The App instance is tldraw's "god object". You can use the app to do
// just about everything that's possible in tldraw. Internally, the canvas
// component and all shapes, tools, and UI components use this instance to
// send events, observe changes, and perform actions.

type ProofStep =
	| { fromNode: string; toNode: string; tacticString: string; hypName: string | null }
	| { name: string; edges: ProofStep[] }

const proof: ProofStep[] = [
	{
		toNode: '∃ p, p ≥ N ∧ Nat.Prime p',
		tacticString: 'intro N',
		hypName: null,
		fromNode: '∀ (N : ℕ), ∃ p, p ≥ N ∧ Nat.Prime p',
	},
	{ toNode: 'ℕ', tacticString: 'intro N', hypName: 'N', fromNode: '⊢' },
	{ toNode: 'ℕ', tacticString: 'let M := Nat.factorial N + 1', hypName: 'M', fromNode: '⊢' },
	{ toNode: 'ℕ', tacticString: 'let p := Nat.minFac M', hypName: 'p', fromNode: '⊢' },
	{
		name: 'have pp : Nat.Prime p',
		edges: [
			{
				toNode: 'M ≠ 1',
				tacticString: 'apply Nat.minFac_prime',
				hypName: null,
				fromNode: 'Nat.Prime p',
			},
			{ name: 'have fac_pos: 0 < Nat.factorial N', edges: [] },
			{ toNode: '⊢', tacticString: 'linarith', hypName: null, fromNode: 'M ≠ 1' },
		],
	},
	{
		name: 'have ppos: p ≥ N',
		edges: [
			{
				toNode: '¬p ≥ N → False',
				tacticString: 'apply by_contradiction',
				hypName: null,
				fromNode: 'p ≥ N',
			},
			{ toNode: 'False', tacticString: 'intro pln', hypName: null, fromNode: '¬p ≥ N → False' },
			{ toNode: '¬p ≥ N', tacticString: 'intro pln', hypName: 'pln', fromNode: '⊢' },
			{
				name: 'have h₁ : p ∣ Nat.factorial N',
				edges: [
					{
						toNode: 'p ≤ N',
						tacticString: 'apply pp.dvd_factorial.mpr',
						hypName: null,
						fromNode: 'p ∣ Nat.factorial N',
					},
					{ toNode: '⊢', tacticString: 'exact le_of_not_ge pln', hypName: null, fromNode: 'p ≤ N' },
				],
			},
			{ name: 'have h₂ : p ∣ Nat.factorial N + 1', edges: [] },
			{ name: 'have h : p ∣ 1', edges: [] },
			{
				toNode: '⊢',
				tacticString: 'exact Nat.Prime.not_dvd_one pp h',
				hypName: null,
				fromNode: 'False',
			},
		],
	},
	{
		toNode: '⊢',
		tacticString: 'exact ⟨ p, ppos, pp ⟩',
		hypName: null,
		fromNode: '∃ p, p ≥ N ∧ Nat.Prime p',
	},
]

export default function Example() {
	const handleMount = (app: App) => {
		const inBetweenMargin = 20
		const framePadding = 20

		const drawNode = (
			parentId: TLParentId | undefined,
			text: string,
			[x, y]: [number, number],
			[w, h]: [number, number]
		) => {
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
						...{ dash: 'draw', fill: 'solid', color: 'light-green' },
						/*...(type == 'value'
							? { dash: 'draw', fill: 'solid', color: 'light-green' }
							: { dash: 'dotted', fill: 'none', color: 'grey' }),*/
						size: 'm',
						text,
					},
				},
			])
		}

		function getFrameSize(nodes: Node[]): [number, number] {
			const size = nodes
				.map(getSize)
				.reduce((acc, [w, h]) => [Math.max(acc[0], w), acc[1] + h], [0, 0])
			return [
				size[0] + framePadding * 2,
				size[1] + inBetweenMargin * (nodes.length - 1) + framePadding * 2,
			]
		}

		function getSize(node: Node): [number, number] {
			if (node.type === 'value') {
				const size = app.textMeasure.measureText({
					...TEXT_PROPS,
					text: node.text,
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
			} else {
				const nodeSize = getSize({ type: 'value', text: node.name })
				const n = node.nodes.length
				if (n == 0) {
					return nodeSize
				}
				const frameSize = getFrameSize(node.nodes)
				return [Math.max(frameSize[0], nodeSize[0]), frameSize[1] + nodeSize[1]]
			}
		}
		const createNode = (
			parentId: TLParentId | undefined,
			text: string,
			x: number,
			y: number,
			type: 'value' | 'tactic' = 'value'
		): [number, number] => {
			const [w, h] = getSize({ type: 'value', text })
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
		app.selectAll().deleteShapes()
		// Create a shape id
		app.focus()

		// We can add level later, but now each node is on it's own level.
		type Node = { type: 'value'; text: string } | { type: 'frame'; name: string; nodes: Node[] }

		function layoutNodes(steps: ProofStep[]): Node[] {
			if (steps.length === 0) {
				return []
			}
			const [step, ...rest] = steps
			if ('fromNode' in step) {
				if (step.fromNode === '⊢') {
					const text = step.tacticString.includes('let')
						? step.tacticString
						: `${step.hypName} : ${step.toNode}`
					return [{ type: 'value', text }, ...layoutNodes(rest)]
				} else {
					return [...layoutNodes(rest), { type: 'value', text: step.fromNode }]
				}
			} else {
				const frameNodes = layoutNodes(step.edges)
				return [{ type: 'frame', name: step.name, nodes: frameNodes }, ...layoutNodes(rest)]
			}
		}

		function drawNodes(parentId: TLParentId | undefined, [x, y]: [number, number], nodes: Node[]) {
			for (const node of nodes) {
				if (node.type === 'value') {
					const size = getSize(node)
					drawNode(parentId, node.text, [x, y], size)
					y += size[1] + inBetweenMargin
				} else {
					const frameId = app.createShapeId()
					if (node.nodes.length > 0) {
						const [w, h] = getFrameSize(node.nodes)
						app.createShapes([
							{
								id: frameId,
								type: 'frame',
								x,
								y,
								props: { w, h },
								parentId,
							},
						])

						drawNodes(frameId, [framePadding, framePadding], node.nodes)
						y += h
					}
					const nameSize = getSize({ type: 'value', text: node.name })
					drawNode(parentId, node.name, [x, y], nameSize)
					y += nameSize[1] + inBetweenMargin
				}
			}
		}

		// Draws `steps` starting at `y` and returns the lowest y value after drawing
		function draw(
			parentId: TLParentId | undefined,
			y: number,
			steps: ProofStep[]
		): [number, number] {
			if (steps.length === 0) {
				return [0, 0]
			}
			const [step, ...rest] = steps
			if ('fromNode' in step) {
				if (step.fromNode === '⊢') {
					const nodeSize = createNode(
						parentId,
						step.tacticString.includes('let')
							? step.tacticString
							: `${step.hypName} : ${step.toNode}`,
						20,
						y
					)
					const restSize = draw(parentId, y + nodeSize[1] + 20, rest)
					return [Math.max(nodeSize[0] + 40, restSize[0]), nodeSize[1] + 20 + restSize[1]]
				} else {
					// Should check for intro and maybe create a new frame.
					/* if (step.tacticString.includes('intro')) {
						const frameId = app.createShapeId()
						app.createShapes([
							{
								id: frameId,
								type: 'frame',
								x: 20,
								y,
								props: {},
								parentId,
							},
						])
						parentId = frameId
					} */
					const restSize = draw(parentId, y, rest)
					const tacticSize = createNode(
						parentId,
						step.tacticString,
						20,
						restSize[1] + y + (rest.length > 0 ? 20 : 0),
						'tactic'
					)
					const valueSize = createNode(
						parentId,
						step.fromNode,
						20,
						restSize[1] + y + (rest.length > 0 ? 20 : 0) + tacticSize[1],
						'value'
					)
					const nodeSize = [tacticSize[0] + valueSize[0], tacticSize[1] + valueSize[1]]
					return [
						Math.max(nodeSize[0] + 40, restSize[0]),
						nodeSize[1] + (rest.length > 0 ? 20 : 0) + restSize[1],
					]
				}
			} else {
				const frameSize = (() => {
					if (step.edges.length > 0) {
						const frameId = app.createShapeId()
						app.createShapes([
							{
								id: frameId,
								type: 'frame',
								x: 20,
								y,
								props: {},
								parentId,
							},
						])
						const frameSize = draw(frameId, 20, step.edges)
						app.updateShapes([
							{ id: frameId, type: 'frame', props: { h: frameSize[1] + 40, w: frameSize[0] } },
						])
						return [frameSize[0] + 40, frameSize[1] + 40]
					} else {
						return [0, 0]
					}
				})()
				const nodeSize = createNode(parentId, step.name, 20, y + frameSize[1])
				const restSize = draw(parentId, y + frameSize[1] + nodeSize[1] + 20, rest)
				return [
					Math.max(nodeSize[0] + 40, Math.max(restSize[0], frameSize[0])),
					nodeSize[1] + 20 + restSize[1] + frameSize[1],
				]
			}
		}
		console.log('Drawing', proof)
		// draw(undefined, 0, proof)
		const layout = layoutNodes(proof)
		drawNodes(undefined, [0, 0], layout)

		// Zoom the camera to fit both shapes
		app.zoomToFit()
	}

	return (
		<div className="tldraw__editor">
			<Tldraw persistenceKey="api-example" onMount={handleMount} autoFocus={false}></Tldraw>
		</div>
	)
}
