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
	{ toNode: 'p', tacticString: 'apply And.intro', hypName: null, fromNode: 'p ∧ q ∧ r' },
	{ toNode: 'q ∧ r', tacticString: 'apply And.intro', hypName: null, fromNode: 'p ∧ q ∧ r' },
	{ toNode: '⊢', tacticString: 'exact hp', hypName: null, fromNode: 'p' },
	{ toNode: 'q', tacticString: 'apply And.intro', hypName: null, fromNode: 'q ∧ p' },
	{ toNode: 'p', tacticString: 'apply And.intro', hypName: null, fromNode: 'q ∧ p' },
	{ toNode: '⊢', tacticString: 'exact hq', hypName: null, fromNode: 'q' },
	{ toNode: '⊢', tacticString: 'exact hp', hypName: null, fromNode: 'p' },
]

const ss: ProofStep[] = [
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

type Node2 = {
	text: string
	id: string
	fromValueTactic?: FromValueTactic
	toValueTactic?: ToValueTactic
	name?: string
	subNodes?: Tree2
}
type FromValueTactic = { text: string; toValueIds: string[] }
type ToValueTactic = { text: string; fromValueIds: string[] }
type NodeLayer2 = Node2[]
type Tree2 = NodeLayer2[]

const example2: Tree2 = [
	[
		{ text: 'p', name: 'hp', id: 'hp' },
		{ text: 'q', name: 'hq', id: 'hq' },
	],
	[
		{ text: 'q', id: 'q', toValueTactic: { text: 'exact hq', fromValueIds: ['hq'] } },
		{ text: 'p', id: 'p2', toValueTactic: { text: 'exact hp', fromValueIds: ['hp'] } },
	],
	[
		{ text: 'p', id: 'p', toValueTactic: { text: 'exact hp', fromValueIds: ['hp'] } },
		{
			text: 'q ∧ p',
			id: 'qp',
			toValueTactic: { text: 'apply And.intro', fromValueIds: ['q', 'p2'] },
		},
	],
	[
		{
			text: 'p ∧ q ∧ p',
			id: 'pqp',
			toValueTactic: { text: 'apply And.intro', fromValueIds: ['p', 'qp'] },
		},
	],
]

type Node =
	| { type: 'value'; text: string; id: string; name?: string; subNodes?: Tree }
	| { type: 'tactic'; text: string; fromValueIds: string[]; toValueIds: string[] }

type NodeLayer = Node[]

type Tree = NodeLayer[]

const example1: Tree = [
	[
		{ type: 'value', text: 'p', name: 'hp', id: 'hp' },
		{ type: 'value', text: 'q', name: 'hq', id: 'hq' },
	],
	[
		{ type: 'tactic', text: 'exact hq', fromValueIds: ['hq'], toValueIds: ['q'] },
		{ type: 'tactic', text: 'exact hp', fromValueIds: ['hp'], toValueIds: ['p2'] },
	],
	[
		{ type: 'value', text: 'q', id: 'q' },
		{ type: 'value', text: 'p', id: 'p2' },
	],
	[
		{ type: 'tactic', text: 'exact hp', fromValueIds: ['hp'], toValueIds: ['p'] },
		{ type: 'tactic', text: 'apply And.intro', fromValueIds: ['q', 'p2'], toValueIds: ['qp'] },
	],
	[
		{ type: 'value', text: 'p', id: 'p' },
		{ type: 'value', text: 'q ∧ p', id: 'qp' },
	],
	[{ type: 'tactic', text: 'apply And.intro', fromValueIds: ['p', 'qp'], toValueIds: ['pqp'] }],
	[{ type: 'value', text: 'p ∧ q ∧ p', id: 'pqp' }],
]

export default function Example() {
	const handleMount = (app: App) => {
		const inBetweenMargin = 20
		const framePadding = 20

		type Size = [number, number]

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

		function getTreeSize(tree: Tree): [number, number] {
			return vStack(inBetweenMargin, ...tree.map((l) => hStack(inBetweenMargin, ...l.map(getSize))))
		}

		function getFrameSize(tree: Tree): [number, number] {
			const size = getTreeSize(tree)
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
			if (node.type === 'value') {
				const valueSize = getTextSize(node.text)
				if (!node.subNodes) {
					return valueSize
				}
				const frameSize = getFrameSize(node.subNodes)
				return vStack(0, frameSize, valueSize)
			} else {
				return getTextSize(node.text)
			}
		}
		app.selectAll().deleteShapes()
		// Create a shape id
		app.focus()

		/*function layoutNodes(steps: ProofStep[]): Node[] {
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
					// We should check if it's an intro (on the goal) , then we should create a separate frame for it.
					if (step.tacticString.startsWith('intro')) {
						return [{ type: 'frame', name: step.tacticString, nodes: [] }, valueNode]
					} else {
						// listBefore [['q', 'q and p'], ['p and q and p']]
						const levels = layoutNodes(rest)
						// fromNode 'q and p' -> toNode: 'p'
						// listAfter [['p'], ['q', 'q and p'], ['p and q and p']]
						for (let i = levels.length - 1; i >= 0; i--) {
							const n = levels[i]
							if (n.type === 'value' && n.text == step.fromNode) {
								return [
									...levels.slice(0, i),
									{ type: 'value', text: step.toNode },
									...levels.slice(i),
								]
							}
						}
						return [
							{ type: 'value', text: step.toNode },
							{ type: 'value', text: step.fromNode },
						]
					}
				}
			} else {
				const frameNodes = layoutNodes(step.edges)
				return [{ type: 'frame', name: step.name, nodes: frameNodes }, ...layoutNodes(rest)]
			}
		}*/

		function drawNodes(parentId: TLParentId | undefined, [x0, y0]: [number, number], tree: Tree) {
			let y = y0
			for (const layer of tree) {
				let x = x0
				for (const node of layer) {
					if (node.type === 'value') {
						const valueSize = drawNode(parentId, node.text, [x, y])
						x += valueSize[1] + inBetweenMargin
						/*						const frameId = app.createShapeId()
						if (node) {
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
						y += nameSize[1] + inBetweenMargin*/
					} else {
						const tacticSize = drawNode(parentId, node.text, [x, y], 'tactic')
						x += tacticSize[0] + inBetweenMargin
					}
				}
				y += getTreeSize([layer])[1] + inBetweenMargin
			}
		}

		console.log('Drawing', proof)
		// const layout = layoutNodes(proof)
		drawNodes(undefined, [0, 0], example1)

		// Zoom the camera to fit both shapes
		app.zoomToFit()
	}

	return (
		<div className="tldraw__editor">
			<Tldraw persistenceKey="api-example" onMount={handleMount} autoFocus={false}></Tldraw>
		</div>
	)
}
