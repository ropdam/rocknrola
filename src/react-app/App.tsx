import { useState, type FormEvent } from "react";
import "./App.css";

const TRANSMISSIONS = [
	{
		id: 1,
		body: "Where did you have THE BEST NOODLES we will never stop talking about?",
		rule: "First 2 letters",
	},
	{
		id: 2,
		body: "Where did you use the famous rose petals for the first time?",
		rule: "First 2 letters",
	},
	{
		id: 3,
		body: "Where did we stumble upon a cute lunch place because someone pressed the wrong button in an elevator?",
		rule: "First letter",
	},
	{
		id: 4,
		body: "Where did we walk a dog with the same name as your brain?",
		rule: ", + first 2 letters",
	},
] as const;

const PLACEHOLDER_COORDS = "48.8566 N, 2.3522 E";

function App() {
	const [code, setCode] = useState("");
	const [expandedTx, setExpandedTx] = useState<number | null>(null);
	const [submitted, setSubmitted] = useState(false);

	function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setSubmitted(true);
	}

	function handleReset() {
		setSubmitted(false);
		setCode("");
	}

	function toggleTx(id: number) {
		setExpandedTx((current) => (current === id ? null : id));
	}

	if (submitted) {
		return (
			<div className="terminal terminal--reveal">
				<div className="scanlines" aria-hidden="true" />
				<div className="reveal-inner">
					<p className="reveal-label">COORDINATES LOCKED</p>
					<p className="reveal-coords" aria-live="polite">
						{PLACEHOLDER_COORDS}
					</p>
					<p className="reveal-sub">Replace placeholder when ready</p>
					<button type="button" className="terminal-btn" onClick={handleReset}>
						RESET TERMINAL
					</button>
				</div>
			</div>
		);
	}

	const active = expandedTx
		? TRANSMISSIONS.find((t) => t.id === expandedTx)
		: null;

	return (
		<div className="terminal terminal--input">
			<div className="scanlines scanlines--input" aria-hidden="true" />

			<div className="terminal-inner">
				<p className="terminal-label">Congratulations on finding the secret url!</p>
				<p className="terminal-sub">
					To find out about your birthday gift you have to input the code.
				</p>
				<p className="tx-intro">
					Answers to the questions below provide the first part of the code.
				</p>

				<form className="code-form" onSubmit={handleSubmit}>
					<input
						type="text"
						className="code-input"
						value={code}
						onChange={(e) => setCode(e.target.value)}
						placeholder="••••••••"
						autoComplete="off"
						spellCheck={false}
						aria-label="Access code"
					/>
					<button type="submit" className="submit-btn" aria-label="Submit code">
						UNLOCK
					</button>
				</form>

				<div className="question-stack">
					<div
						className="question-buttons"
						role="group"
						aria-label="Incoming transmissions"
					>
						{TRANSMISSIONS.map((t) => {
							const isOpen = expandedTx === t.id;
							return (
								<button
									key={t.id}
									type="button"
									className={`question-btn ${isOpen ? "question-btn--open" : ""}`}
									onClick={() => toggleTx(t.id)}
									aria-expanded={isOpen}
									aria-controls={`tx-panel-${t.id}`}
									id={`tx-trigger-${t.id}`}
									aria-label={`Question ${t.id}`}
								>
									{t.id}
								</button>
							);
						})}
					</div>
					<div className="question-reveal-slot" aria-live="polite">
						{active && (
							<div
								key={active.id}
								id={`tx-panel-${active.id}`}
								className="question-reveal"
								role="region"
								aria-labelledby={`tx-trigger-${active.id}`}
							>
								<p className="question-reveal-body">{active.body}</p>
								<p className="question-reveal-rule">
									<span className="question-reveal-rule-label">EXTRACT:</span>{" "}
									{active.rule}
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

export default App;
