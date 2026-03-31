import { useState, type FormEvent } from "react";
import confetti from "canvas-confetti";
import "./App.css";

const UNLOCK_STORAGE_KEY = "rocknrola-gift-unlocked";

function readStoredUnlock(): boolean {
	if (typeof window === "undefined") return false;
	try {
		return localStorage.getItem(UNLOCK_STORAGE_KEY) === "1";
	} catch {
		return false;
	}
}

function persistUnlock() {
	try {
		localStorage.setItem(UNLOCK_STORAGE_KEY, "1");
	} catch {
		/* ignore quota / private mode */
	}
}

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

/** Unlock screen fades out before the success message */
const FORM_FADE_MS = 1400;
/** "CODE CORRECT" box fade in (matches CSS) */
const CODE_CORRECT_FADE_IN_MS = 900;
/** How long the message stays readable after fade-in */
const CODE_CORRECT_HOLD_MS = 1700;
/** "CODE CORRECT" box fade out (matches CSS) */
const CODE_CORRECT_FADE_OUT_MS = 1000;

/** Brief pause after reveal mounts before confetti (builds anticipation) */
const TENSION_MS = 2800;
/** Side streamers + celebration duration after the burst */
const CONFETTI_STREAM_MS = 4000;

const CONFETTI_COLORS = ["#ff6b9d", "#ffd93d", "#6bcb77", "#4d96ff", "#ff6b6b"];

function isTouchOrNarrowMobile(): boolean {
	if (typeof window === "undefined") return false;
	const coarse =
		typeof window.matchMedia === "function" &&
		window.matchMedia("(pointer: coarse)").matches;
	return coarse || window.innerWidth <= 480;
}

function runBirthdayConfetti(streamDurationMs: number) {
	const end = Date.now() + streamDurationMs;
	const mobile = isTouchOrNarrowMobile();
	const common = {
		colors: CONFETTI_COLORS,
		zIndex: 10000,
	} as const;

	const burst1 = mobile ? 70 : 140;
	const burst2 = mobile ? 30 : 60;
	const sideParticles = mobile ? 5 : 10;

	confetti({
		...common,
		particleCount: burst1,
		spread: 160,
		startVelocity: 55,
		origin: { x: 0.5, y: 0.42 },
		scalar: 1.1,
	});
	confetti({
		...common,
		particleCount: burst2,
		spread: 120,
		startVelocity: 45,
		origin: { x: 0.5, y: 0.55 },
		ticks: 200,
		gravity: 1.1,
	});

	let frameCount = 0;
	const frame = () => {
		frameCount += 1;
		const shouldEmitSide = !mobile || frameCount % 3 === 0;
		if (shouldEmitSide) {
			confetti({
				...common,
				particleCount: sideParticles,
				angle: 60,
				spread: 65,
				origin: { x: 0, y: 0.92 },
			});
			confetti({
				...common,
				particleCount: sideParticles,
				angle: 120,
				spread: 65,
				origin: { x: 1, y: 0.92 },
			});
		}
		if (Date.now() < end) {
			requestAnimationFrame(frame);
		}
	};
	frame();
}

function App() {
	const [code, setCode] = useState("");
	const [expandedTx, setExpandedTx] = useState<number | null>(null);
	const [submitted, setSubmitted] = useState(readStoredUnlock);
	/** After CODE CORRECT, empty screen while tension + confetti run — reveal mounts only after */
	const [celebrating, setCelebrating] = useState(false);
	const [loading, setLoading] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [shakeInput, setShakeInput] = useState(false);
	const [detailsOpen, setDetailsOpen] = useState(false);
	const [preRevealPhase, setPreRevealPhase] = useState<
		"none" | "form_fading" | "code_correct_visible" | "code_correct_fading"
	>("none");

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setSubmitError(null);
		setShakeInput(false);
		setLoading(true);
		try {
			const res = await fetch("/api/verify-code", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ code }),
			});
			let data: { valid?: boolean } = {};
			try {
				data = (await res.json()) as { valid?: boolean };
			} catch {
				// non-JSON response
			}

			if (!res.ok || !data.valid) {
				setSubmitError("Invalid code");
				setShakeInput(true);
				window.setTimeout(() => setShakeInput(false), 500);
				return;
			}

			const reducedMotion =
				typeof window !== "undefined" &&
				window.matchMedia("(prefers-reduced-motion: reduce)").matches;

			if (reducedMotion) {
				persistUnlock();
				setSubmitted(true);
			} else {
				setPreRevealPhase("form_fading");
				await new Promise((r) => window.setTimeout(r, FORM_FADE_MS));
				setPreRevealPhase("code_correct_visible");
				await new Promise((r) =>
					window.setTimeout(r, CODE_CORRECT_FADE_IN_MS + CODE_CORRECT_HOLD_MS),
				);
				setPreRevealPhase("code_correct_fading");
				await new Promise((r) => window.setTimeout(r, CODE_CORRECT_FADE_OUT_MS));
				setPreRevealPhase("none");

				setCelebrating(true);
				await new Promise((r) => window.setTimeout(r, TENSION_MS));
				runBirthdayConfetti(CONFETTI_STREAM_MS);
				await new Promise((r) => window.setTimeout(r, CONFETTI_STREAM_MS));
				setCelebrating(false);
				persistUnlock();
				setSubmitted(true);
			}
		} catch {
			setSubmitError("Could not verify. Try again.");
		} finally {
			setLoading(false);
		}
	}

	function toggleTx(id: number) {
		setExpandedTx((current) => (current === id ? null : id));
	}

	if (submitted) {
		return (
			<div className="terminal terminal--reveal">
				<div className="scanlines" aria-hidden="true" />
				<div
					className={`reveal-inner reveal-inner--entered${detailsOpen ? " reveal-inner--details-open" : ""}`}
				>
					<p className="reveal-date" aria-live="polite">
						3rd of June, 20.00
					</p>
					<p className="reveal-location">The Hague</p>
					<div className="reveal-details">
						<button
							type="button"
							className={`reveal-details-trigger ${detailsOpen ? "reveal-details-trigger--open" : ""}`}
							onClick={() => setDetailsOpen((o) => !o)}
							aria-expanded={detailsOpen}
							aria-controls="reveal-details-panel"
							id="reveal-details-trigger"
						>
							Details
						</button>
						{detailsOpen && (
							<div
								id="reveal-details-panel"
								className="reveal-details-panel"
								role="region"
								aria-labelledby="reveal-details-trigger"
							>
								<dl className="reveal-details-list">
									<div className="reveal-details-row">
										<dt>Dresscode</dt>
										<dd>
											Formal (dress, make-up, rings, etc.)
										</dd>
									</div>
									<div className="reveal-details-row">
										<dt>Special things to bring</dt>
										<dd>None</dd>
									</div>
									<div className="reveal-details-row">
										<dt>Other people we know</dt>
										<dd>None</dd>
									</div>
								</dl>
							</div>
						)}
					</div>
				</div>
			</div>
		);
	}

	if (celebrating) {
		return (
			<div
				className="terminal terminal--interlude"
				role="status"
				aria-live="polite"
				aria-label="Celebration"
			>
				<div className="scanlines scanlines--input" aria-hidden="true" />
				<span className="visually-hidden">Celebration in progress</span>
			</div>
		);
	}

	const active = expandedTx
		? TRANSMISSIONS.find((t) => t.id === expandedTx)
		: null;

	const showCodeCorrect =
		preRevealPhase === "code_correct_visible" ||
		preRevealPhase === "code_correct_fading";

	return (
		<div
			className={`terminal terminal--input ${preRevealPhase !== "none" ? "terminal--input--exit" : ""}`}
		>
			<div className="scanlines scanlines--input" aria-hidden="true" />

			<div className="terminal-inner">
				<p className="terminal-label">Congratulations on finding the secret url!</p>
				<p className="terminal-sub">
					To find out about your birthday gift you have to input the code.
				</p>
				<p className="tx-intro">
					Answers to the questions below provide the first part of a sentence. Fill in the completed sentence to unlock your gift.
				</p>

				<form
					className={`code-form ${shakeInput ? "code-form--shake" : ""}`}
					onSubmit={handleSubmit}
					aria-busy={loading}
				>
					<input
						type="text"
						className="code-input"
						value={code}
						onChange={(e) => setCode(e.target.value)}
						placeholder="••••••••"
						autoComplete="off"
						spellCheck={false}
						aria-label="Access code"
						aria-invalid={submitError ? true : undefined}
						aria-describedby={submitError ? "code-error" : undefined}
						disabled={loading}
					/>
					<button
						type="submit"
						className="submit-btn"
						aria-label="Submit code"
						disabled={loading}
					>
						{loading ? "UNLOCKING…" : "UNLOCK"}
					</button>
				</form>
				{submitError && (
					<p id="code-error" className="code-error" role="alert">
						{submitError}
					</p>
				)}

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

			{showCodeCorrect && (
				<div className="code-correct-layer">
					<div
						className={`code-correct-box ${
							preRevealPhase === "code_correct_visible"
								? "code-correct-box--in"
								: "code-correct-box--out"
						}`}
						role="status"
						aria-live="polite"
					>
						<span className="code-correct-label">CODE CORRECT</span>
					</div>
				</div>
			)}
		</div>
	);
}

export default App;
