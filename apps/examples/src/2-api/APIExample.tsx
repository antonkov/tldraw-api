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
			type: 'value' | 'tactic' = 'value'
		) => {
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

		function getFrameSize(nodes: Node[]): [number, number] {
			const size = vStack(...nodes.map(getSize))
			return [
				size[0] + framePadding * 2,
				size[1] + inBetweenMargin * (nodes.length - 1) + framePadding * 2,
			]
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

		type Size = [number, number]

		function vStack(...boxes: Size[]): Size {
			const w = Math.max(...boxes.map((b) => b[0]))
			const h = boxes.map((b) => b[1]).reduce((x, y) => x + y)
			return [w, h]
		}

		function getSize(node: Node): [number, number] {
			if (node.type === 'value') {
				const tacticSize: Size = node.viaTactic ? getTextSize(node.viaTactic) : [0, 0]
				const valueSize = getTextSize(node.text)
				return vStack(tacticSize, valueSize)
			} else {
				const nodeSize = getSize({ type: 'value', text: node.name })
				const n = node.nodes.length
				if (n == 0) {
					return nodeSize
				}
				const frameSize = getFrameSize(node.nodes)
				return vStack(frameSize, nodeSize)
			}
		}
		app.selectAll().deleteShapes()
		// Create a shape id
		app.focus()

		// We can add level later, but now each node is on it's own level.
		type Node =
			| { type: 'value'; text: string; viaTactic?: string | null }
			| { type: 'frame'; name: string; nodes: Node[] }

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
					const valueNode: Node = {
						type: 'value',
						text: step.fromNode,
						viaTactic: step.tacticString,
					}
					// We should check if it's a first intro, then we should create a separate frame for it.
					if (step.tacticString.startsWith('intro')) {
						return [{ type: 'frame', name: step.tacticString, nodes: layoutNodes(rest) }, valueNode]
					} else {
						return [...layoutNodes(rest), valueNode]
					}
				}
			} else {
				const frameNodes = layoutNodes(step.edges)
				return [{ type: 'frame', name: step.name, nodes: frameNodes }, ...layoutNodes(rest)]
			}
		}

		function drawNodes(parentId: TLParentId | undefined, [x, y]: [number, number], nodes: Node[]) {
			for (const node of nodes) {
				if (node.type === 'value') {
					if (node.viaTactic) {
						const tacticSize = drawNode(parentId, node.viaTactic, [x, y], 'tactic')
						y += tacticSize[1]
					}
					const valueSize = drawNode(parentId, node.text, [x, y])
					y += valueSize[1] + inBetweenMargin
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
					const nameSize = drawNode(parentId, node.name, [x, y], 'tactic')
					y += nameSize[1] + inBetweenMargin
				}
			}
		}

		console.log('Drawing', proof)
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
