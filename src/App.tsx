import React, { useEffect, useMemo, useRef, useState } from "react";
import { categories } from "./categories";

// 🥦 EU-Verordnungskompatibler Namensgenerator — UX-Plus Edition
// Fokus: klares Feedback, Micro-Interactions, A11y und kleine Quality-of-Life-Extras

export default function VeganWordGeneratorFunnyPlus() {
    const [term, setTerm] = useState("");
    const [results, setResults] = useState<string[]>([]);
    const [lastResults, setLastResults] = useState<string[] | null>(null);
    const [count, setCount] = useState(1);
    const [concise, setConcise] = useState(true);
    const [history, setHistory] = useState<string[]>(() => {
        try {
            const raw = localStorage.getItem("vegagen-history");
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });

    // UI state
    const [isGenerating, setIsGenerating] = useState(false);
    const [toast, setToast] = useState<null | { type: "success" | "info" | "error"; msg: string }>(null);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [justCleared, setJustCleared] = useState(false);
    const [inputError, setInputError] = useState<string | null>(null);
    const liveRegionRef = useRef<HTMLDivElement>(null);

    // derived
    const canGenerate = term.trim().length > 0;
    const detectedCategory = useMemo(() => detectCategory(term), [term]);

    useEffect(() => {
        localStorage.setItem("vegagen-history", JSON.stringify(history));
    }, [history]);

    useEffect(() => {
        if (!canGenerate && term.length > 0) {
            setInputError("Bitte gib einen sinnvollen Begriff ein.");
        } else {
            setInputError(null);
        }
    }, [term, canGenerate]);

    useEffect(() => {
        if (toast) {
            const t = setTimeout(() => setToast(null), 1600);
            return () => clearTimeout(t);
        }
    }, [toast]);

    function detectCategory(word: string) {
        const lower = word.toLowerCase();
        if (/(wurst|sausage|brat)/.test(lower)) return "wurst";
        if (/(burger|patty)/.test(lower)) return "burger";
        if (/(schnitzel|cutlet)/.test(lower)) return "schnitzel";
        if (/(milch|milk|hafer|soja)/.test(lower)) return "milch";
        if (/(steak|filet)/.test(lower)) return "steak";
        if (/(hack|mince)/.test(lower)) return "hack";
        if (/(kase|käse|cheese)/.test(lower)) return "käse";
        if (/(fisch|fish|lachs)/.test(lower)) return "fisch";
        return "default";
    }

    function choice<T>(arr: T[]): T {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    const suffixes = [
        "pflanzlich",
        "tierfrei",
        "ohne Kuh",
        "vegan",
        "aus Erbse",
        "klimafreundlich",
        "aus Hafer",
        "aus Soja",
        "ohne Reue",
        "nachhaltig",
    ];

    function makeOne(termText: string): string {
        const cat = detectCategory(termText);
        const pool = (categories as any)[cat] || (categories as any).default;

        const base = choice<string>(pool);
        const addSuffix = Math.random() < 0.5;
        const suffix = addSuffix ? choice(suffixes) : "";

        const fancyJoin = Math.random() < 0.2 ? "-" : " ";

        let result: string  = suffix ? `${base}${fancyJoin}${suffix}` : base;

        if (concise && result.length > 38) {
            result = base;
        }

        return result;
    }

    function vibrate(ms = 20) {
        try {
            if (navigator.vibrate) navigator.vibrate(ms);
        } catch {}
    }

    function generate(listTerm: string) {
        const wanted = Math.max(1, Math.min(5, count));
        const list: string[] = [];
        while (list.length < wanted) {
            const gen = makeOne(listTerm);
            if (!list.includes(gen)) list.push(gen);
        }
        setLastResults(results.length ? results : null);
        setResults(list);
        setHistory((h) => [listTerm, ...h.filter((x) => x !== listTerm).slice(0, 24)]);
        setJustCleared(false);
        announce(`${list.length} Vorschläge generiert`);
    }

    async function handleGenerate() {
        if (!canGenerate) {
            setInputError("Bitte gib zuerst einen Begriff ein.");
            vibrate(30);
            return;
        }
        try {
            setIsGenerating(true);
            await wait(350); // kleines, spürbares Feedback
            generate(term);
            setToast({ type: "success", msg: "Neue Namen sind da!" });
        } finally {
            setIsGenerating(false);
        }
    }

    function handleLucky() {
        const funnySeeds = [
            "Tofu-Wurst",
            "Hafer-Milch",
            "Beyond-Burger",
            "Garten-Schnitzel",
            "Pilz-Steak",
            "Erbsen-Hack",
            "Cashew-Käse",
            "Algen-Fisch",
        ];
        const picked = choice(funnySeeds);
        setTerm(picked);
        setIsGenerating(true);
        wait(250).then(() => {
            generate(picked);
            setIsGenerating(false);
            setToast({ type: "info", msg: `Glücksgriff: ${picked}` });
        });
    }

    function copyAll() {
        navigator.clipboard.writeText(results.join("\n"));
        setToast({ type: "success", msg: "Alle Vorschläge kopiert" });
        vibrate();
        announce("Alle Vorschläge in die Zwischenablage kopiert");
    }

    function announce(message: string) {
        const el = liveRegionRef.current;
        if (!el) return;
        el.textContent = message;
        // reset text so screenreaders re-announce next time too
        setTimeout(() => {
            if (el.textContent === message) el.textContent = "";
        }, 1000);
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") {
            e.preventDefault();
            handleGenerate();
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-100 to-emerald-200 p-3 sm:p-6 flex flex-col items-center">
            {/* Live region for SR feedback */}
            <div
                ref={liveRegionRef}
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
            />

            {/* Toast */}
            {toast && (
                <div
                    role="status"
                    className={`fixed top-3 inset-x-0 mx-auto w-fit z-50 rounded-xl px-4 py-2 shadow-md border text-sm backdrop-blur bg-white/90 ${
                        toast.type === "success"
                            ? "border-emerald-300"
                            : toast.type === "error"
                                ? "border-red-300"
                                : "border-amber-300"
                    }`}
                >
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <header className="w-full max-w-3xl text-center">
                <h1 className="text-3xl sm:text-5xl font-extrabold mb-2 text-emerald-800 tracking-tight">
                    🥦 EU-Verordnungskompatibler Namensgenerator
                </h1>
                <p className="text-emerald-900/80 mb-4 sm:mb-6 max-w-2xl mx-auto text-base sm:text-lg">
                    Lustige, kreative und teilweise völlig absurde Namensideen für pflanzliche Produkte.
                </p>
            </header>

            {/* Card */}
            <main className="w-full max-w-3xl rounded-2xl border border-emerald-700/20 bg-white/70 shadow-xl backdrop-blur-sm">
                <div className="p-4 sm:p-6 grid gap-4">
                    {/* Input + CTAs */}
                    <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                        <div className="flex flex-col gap-1">
                            <div className="relative">
                                <input
                                    aria-label="Begriff eingeben"
                                    className={`bg-white/90 w-full border rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 transition ${
                                        inputError
                                            ? "border-red-300 focus:ring-red-400"
                                            : "border-emerald-900/10 focus:ring-emerald-500"
                                    }`}
                                    placeholder="z. B. Tofu-Wurst"
                                    value={term}
                                    onChange={(e) => setTerm(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    inputMode="text"
                                    autoComplete="off"
                                />
                                {/* Char counter */}
                                <span className="absolute right-3 bottom-1 text-[10px] text-emerald-900/50">
                  {term.length}
                </span>
                            </div>

                            {/* Category pill + helper */}
                            <div className="flex items-center gap-2 min-h-[1.5rem]">
                                {term && (
                                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-900/80">
                    Kategorie erkannt:
                    <strong className="font-semibold capitalize">{detectedCategory}</strong>
                  </span>
                                )}
                                {inputError && (
                                    <span className="text-xs text-red-600">{inputError}</span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 md:justify-end">
                            <button
                                onClick={handleGenerate}
                                disabled={!canGenerate || isGenerating}
                                className="rounded-xl px-4 h-12 font-medium text-white bg-emerald-600 enabled:hover:bg-emerald-700 disabled:opacity-50 w-full sm:w-auto inline-flex items-center justify-center gap-2"
                            >
                                {isGenerating && (
                                    <Spinner className="h-4 w-4" />
                                )}
                                Namen generieren
                            </button>
                            <button
                                onClick={handleLucky}
                                disabled={isGenerating}
                                className="rounded-xl px-4 h-12 font-medium bg-emerald-100 text-emerald-900 hover:bg-emerald-200 w-full sm:w-auto"
                            >
                                Auf gut Glück
                            </button>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-emerald-900/90">Anzahl</span>
                            <select
                                aria-label="Anzahl der Ergebnisse"
                                className="bg-white/90 border border-emerald-900/10 rounded-lg px-3 py-2 h-11"
                                value={count}
                                onChange={(e) => setCount(Math.min(5, Math.max(1, parseInt(e.target.value))))}
                            >
                                {[1, 2, 3, 4, 5].map((n) => (
                                    <option key={n} value={n}>
                                        {n}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <label className="flex items-center gap-3 sm:ml-auto">
                            <input
                                type="checkbox"
                                className="h-5 w-5 accent-emerald-600"
                                checked={concise}
                                onChange={(e) => setConcise(e.target.checked)}
                            />
                            <span className="text-sm font-medium text-emerald-900/90">Kurz & knackig</span>
                        </label>
                    </div>

                    {/* Actions when results exist */}
                    {results.length > 0 && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <div className="flex gap-2">
                                <button
                                    onClick={copyAll}
                                    className="rounded-xl px-3 h-10 border border-emerald-900/10 bg-white/80 hover:bg-white"
                                >
                                    Alles kopieren
                                </button>
                                <button
                                    onClick={() => {
                                        setLastResults(results);
                                        setResults([]);
                                        setJustCleared(true);
                                        setToast({ type: "info", msg: "Liste geleert" });
                                    }}
                                    className="rounded-xl px-3 h-10 hover:bg-emerald-100"
                                >
                                    Leeren
                                </button>
                                {justCleared && lastResults && (
                                    <button
                                        onClick={() => {
                                            setResults(lastResults);
                                            setJustCleared(false);
                                            setToast({ type: "success", msg: "Wiederhergestellt" });
                                        }}
                                        className="rounded-xl px-3 h-10 border border-emerald-900/10 bg-white/80 hover:bg-white"
                                    >
                                        Rückgängig
                                    </button>
                                )}
                            </div>
                            <span className="text-xs text-emerald-900/60 sm:ml-auto">Tippe auf einen Vorschlag, um ihn zu kopieren.</span>
                        </div>
                    )}

                    {/* Results */}
                    <ul className="grid gap-2 sm:gap-3">
                        {results.map((r, i) => (
                            <li
                                key={`${r}-${i}`}
                                className="p-3 sm:p-3 rounded-xl bg-white/90 border border-emerald-900/10 shadow-sm flex flex-col sm:flex-row sm:items-start justify-between gap-2 transition hover:shadow-md"
                            >
                                <button
                                    className="text-left leading-snug"
                                    title="Klicken zum Kopieren"
                                    onClick={async () => {
                                        await navigator.clipboard.writeText(r);
                                        setCopiedIndex(i);
                                        vibrate();
                                        setTimeout(() => setCopiedIndex((x) => (x === i ? null : x)), 800);
                                        setToast({ type: "success", msg: "Kopiert" });
                                        announce(`\"${r}\" kopiert`);
                                    }}
                                >
                                    {r}
                                </button>

                                <button
                                    className="self-end sm:self-auto text-xs sm:text-sm px-2 py-1 rounded-lg hover:bg-emerald-100 inline-flex items-center gap-1"
                                    onClick={async () => {
                                        await navigator.clipboard.writeText(r);
                                        setCopiedIndex(i);
                                        vibrate();
                                        setTimeout(() => setCopiedIndex((x) => (x === i ? null : x)), 800);
                                        setToast({ type: "success", msg: "Kopiert" });
                                        announce(`\"${r}\" kopiert`);
                                    }}
                                >
                                    {copiedIndex === i ? (
                                        <span className="inline-flex items-center gap-1">
                      <CheckIcon className="h-4 w-4" />
                      Kopiert
                    </span>
                                    ) : (
                                        "Kopieren"
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </main>

            {/* History */}
            {history.length > 0 && (
                <section className="w-full max-w-3xl mt-4 sm:mt-6">
                    <div className="rounded-2xl border border-emerald-700/20 bg-white/70">
                        <div className="px-4 sm:px-6 pt-5 pb-0 font-semibold text-emerald-900 flex items-center gap-2">
                            ℹ️ Zuletzt verwendete Begriffe
                        </div>
                        <div className="p-3 sm:p-4 flex flex-wrap gap-2">
                            {history.map((h, i) => (
                                <button
                                    key={i}
                                    className="text-sm rounded-xl px-3 py-2 bg-emerald-100 hover:bg-emerald-200"
                                    onClick={() => {
                                        setTerm(h);
                                        setIsGenerating(true);
                                        wait(200).then(() => {
                                            generate(h);
                                            setIsGenerating(false);
                                            setToast({ type: "info", msg: `Erneut generiert für \"${h}\"` });
                                        });
                                    }}
                                >
                                    {h}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Disclaimer */}
            <p className="mt-4 sm:mt-6 text-emerald-900/80 text-xs sm:text-sm text-center max-w-3xl px-3">
                Diese Seite ist Satire. Alle Begriffe sind frei erfunden und dienen nur der Unterhaltung.
            </p>
        </div>
    );
}

function Spinner({ className = "" }) {
    return (
        <svg
            className={`animate-spin ${className}`}
            viewBox="0 0 24 24"
            role="img"
            aria-label="Lädt"
        >
            <circle cx="12" cy="12" r="10" strokeWidth="4" className="opacity-25" stroke="currentColor" fill="none" />
            <path d="M4 12a8 8 0 018-8" strokeWidth="4" stroke="currentColor" className="opacity-75" fill="none" />
        </svg>
    );
}

function CheckIcon({ className = "" }) {
    return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
            <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function wait(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
}
