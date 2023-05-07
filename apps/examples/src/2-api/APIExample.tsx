import { App, LABEL_FONT_SIZES, TEXT_PROPS, Tldraw } from '@tldraw/tldraw'
import '@tldraw/tldraw/editor.css'
import '@tldraw/tldraw/ui.css'

// The tldraw component shares its App instance via its onMount callback prop.

// The App instance is tldraw's "god object". You can use the app to do
// just about everything that's possible in tldraw. Internally, the canvas
// component and all shapes, tools, and UI components use this instance to
// send events, observe changes, and perform actions.

type ProofStep =
	| { fromNode: string; toNode: string; tacticString: string }
	| { name: string; edges: ProofStep[] }

const proof: ProofStep[] = [
	{
		toNode: '∃ p, p ≥ N ∧ Nat.Prime p',
		tacticString: 'intro N',
		fromNode: '∀ (N : ℕ), ∃ p, p ≥ N ∧ Nat.Prime p',
	},
	{ toNode: 'ℕ', tacticString: 'intro N', fromNode: '⊢' },
	{ toNode: 'ℕ', tacticString: 'let M := Nat.factorial N + 1', fromNode: '⊢' },
	{ toNode: 'ℕ', tacticString: 'let p := Nat.minFac M', fromNode: '⊢' },
	{
		name: 'have pp : Nat.Prime p',
		edges: [
			{ toNode: 'M ≠ 1', tacticString: 'apply Nat.minFac_prime', fromNode: 'Nat.Prime p' },
			{ name: 'have fac_pos: 0 < Nat.factorial N', edges: [] },
			{ toNode: '⊢', tacticString: 'linarith', fromNode: 'M ≠ 1' },
		],
	},
	{
		name: 'have ppos: p ≥ N',
		edges: [
			{ toNode: '¬p ≥ N → False', tacticString: 'apply by_contradiction', fromNode: 'p ≥ N' },
			{ toNode: 'False', tacticString: 'intro pln', fromNode: '¬p ≥ N → False' },
			{ toNode: '¬p ≥ N', tacticString: 'intro pln', fromNode: '⊢' },
			{
				name: 'have h₁ : p ∣ Nat.factorial N',
				edges: [
					{
						toNode: 'p ≤ N',
						tacticString: 'apply pp.dvd_factorial.mpr',
						fromNode: 'p ∣ Nat.factorial N',
					},
					{ toNode: '⊢', tacticString: 'exact le_of_not_ge pln', fromNode: 'p ≤ N' },
				],
			},
			{ name: 'have h₂ : p ∣ Nat.factorial N + 1', edges: [] },
			{ name: 'have h : p ∣ 1', edges: [] },
			{ toNode: '⊢', tacticString: 'exact Nat.Prime.not_dvd_one pp h', fromNode: 'False' },
		],
	},
	{ toNode: '⊢', tacticString: 'exact ⟨ p, ppos, pp ⟩', fromNode: '∃ p, p ≥ N ∧ Nat.Prime p' },
]

export default function Example() {
	const handleMount = (app: App) => {
		const createNode = (text: string, x: number, y: number): number => {
			const size = app.textMeasure.measureText({
				...TEXT_PROPS,
				text,
				fontFamily: 'draw',
				fontSize: LABEL_FONT_SIZES['m'],
				width: 'fit-content',
				padding: '16px',
			})
			app.createShapes([
				{
					id: app.createShapeId(text),
					type: 'geo',
					x,
					y,
					props: {
						geo: 'rectangle',
						// Don't know how to calculate size correctly yet
						w: size.w * 1.3,
						h: size.h,
						dash: 'draw',
						fill: 'solid',
						color: 'light-green',
						size: 'm',
						text,
					},
				},
			])
			return y + size.h
		}
		app.selectAll().deleteShapes()
		// Create a shape id
		app.focus()

		// Draws `steps` starting at `y` and returns the lowest y value after drawing
		function draw(y: number, steps: ProofStep[]): number {
			if (steps.length === 0) {
				return y
			}
			const [step, ...rest] = steps
			if ('fromNode' in step) {
				if (step.fromNode === '⊢') {
					return draw(createNode(step.tacticString, 0, y) + 20, rest)
				} else {
					y = draw(y, rest) + 20
					return createNode(step.tacticString, 0, y)
				}
			} else {
				y = draw(y, step.edges) + 20
				y = createNode(step.name, 0, y)
				return draw(y, rest)
			}
		}
		draw(0, proof)

		// Zoom the camera to fit both shapes
		app.zoomToFit()
	}

	return (
		<div className="tldraw__editor">
			<Tldraw persistenceKey="api-example" onMount={handleMount} autoFocus={false}></Tldraw>
		</div>
	)
}
