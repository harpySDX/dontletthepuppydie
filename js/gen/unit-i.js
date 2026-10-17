/*
 * Unit I — financial literacy: compound interest, investments (including reading a technology table),
 * loans with regular payments, and buying versus leasing. Rates, periods and units are kept consistent:
 * the rate per period is always the annual rate divided by the compounding (or payment) frequency.
 */
(function (root) {
  "use strict";
  const B = root.Bank; if (!B) return;
  const { K } = B;
  const R = String.raw;
  const FREQ = { 1: "annually", 2: "semi-annually", 4: "quarterly", 12: "monthly" };
  const $ = (x) => K.money(x);
  const amount = (P, r, n, t) => P * Math.pow(1 + r / n, n * t);
  const pmt = (P, i, N) => (P * i) / (1 - Math.pow(1 + i, -N));

  B.family({
    id: "i_compound", unit: "I", sub: "I.compound", title: "Compound interest", concepts: ["finance.interest"],
    kinds: ["wr"], modes: ["simple", "normal", "challenge"], answer: "dollars", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["future value", "interest earned", "present value needed", "years to reach a goal"],
    gen(r, mode) {
      const P = K.pick(r, [500, 750, 1000, 1200, 1500, 2000, 2500, 3000, 5000]);
      const rate = K.pick(r, mode === "simple" ? [2, 3, 4, 5, 6] : [2.4, 3, 3.5, 4.2, 4.8, 5.5, 6]) / 100;
      const n = mode === "simple" ? 1 : K.pick(r, [2, 4, 12]);
      const t = K.int(r, 2, mode === "simple" ? 6 : 15);
      const T = mode === "simple" ? "fv" : mode === "normal" ? K.pick(r, ["fv", "interest"]) : K.pick(r, ["pv", "years", "interest"]);
      const pct = +(rate * 100).toFixed(2);
      const i = rate / n;
      if (T === "years") {
        const goal = Math.round(P * K.pick(r, [1.25, 1.5, 1.75, 2]));
        let periods = 0, bal = P; while (bal < goal && periods < 2000) { bal *= 1 + i; periods++; }
        const years = Math.ceil(periods / n);
        return { kind: "wr", template: "years to reach a goal", sig: `y|${P}|${pct}|${n}|${goal}`, title: "Compound interest",
          intro: R`$${$(P)} is invested at ${pct}% per year, compounded ${FREQ[n]}. After how many whole years will it first be worth at least $${$(goal)}? (Use a table of values or a calculator.)`,
          parts: [{ key: "a", label: "", prompt: "Years:", kind: "expr", form: "value", answer: String(years), marks: 2 }],
          solution: [R`Each ${n === 1 ? "year" : "period"} multiplies the balance by \(1 + \tfrac{${rate}}{${n}} = ${(1 + i).toFixed(6)}\).`, R`After ${years - 1} years: $${$(amount(P, rate, n, years - 1))} (not enough). After ${years} years: $${$(amount(P, rate, n, years))} ✓.`],
          rubric: ["Growth factor — 1", "First year reaching the goal — 1"], hints: ["Compute A = P(1 + r/n)^(nt) for t = 1, 2, 3, … until it passes the goal.", "A spreadsheet or the table feature on a graphing calculator does this quickly."] };
      }
      const A = amount(P, rate, n, t);
      if (T === "pv") {
        const goal = K.pick(r, [5000, 8000, 10000, 12000, 15000, 20000]);
        const PV = goal / Math.pow(1 + i, n * t);
        return { kind: "wr", template: "present value needed", sig: `pv|${goal}|${pct}|${n}|${t}`, title: "Present value",
          intro: R`How much must be invested now at ${pct}% per year, compounded ${FREQ[n]}, to have $${$(goal)} in ${t} years? (to the nearest cent)`,
          parts: [{ key: "a", label: "", prompt: "Principal ($):", kind: "approx", answer: PV, dp: 2, unit: "$", marks: 2 }],
          solution: [R`\(P = \dfrac{A}{(1 + i)^{N}}\) with \(i = \tfrac{${rate}}{${n}}\), \(N = ${n} \times ${t} = ${n * t}\).`, R`\(P = \dfrac{${goal}}{(${(1 + i).toFixed(6)})^{${n * t}}} \approx \$${$(PV)}\).`],
          rubric: ["Formula rearranged — 1", "Answer — 1"], hints: ["Rearrange A = P(1 + i)^N to P = A ÷ (1 + i)^N."] };
      }
      const parts = T === "interest"
        ? [{ key: "a", label: "(a)", prompt: "Final amount ($):", kind: "approx", answer: A, dp: 2, unit: "$", marks: 1 }, { key: "b", label: "(b)", prompt: "Interest earned ($):", kind: "approx", answer: A - P, dp: 2, unit: "$", marks: 1 }]
        : [{ key: "a", label: "", prompt: "Final amount ($):", kind: "approx", answer: A, dp: 2, unit: "$", marks: 2, wrongs: [{ value: P * (1 + rate * t), note: "That's simple interest. Compound interest earns interest on the interest: A = P(1 + r/n)^(nt)." }, { value: P * Math.pow(1 + rate, n * t), note: "Divide the annual rate by the number of compounding periods per year." }] }];
      return { kind: "wr", template: T === "interest" ? "interest earned" : "future value", sig: `${T}|${P}|${pct}|${n}|${t}`, title: "Compound interest",
        intro: R`$${$(P)} is invested at ${pct}% per year, compounded ${FREQ[n]}, for ${t} years.`,
        parts, solution: [R`\(A = P\left(1 + \tfrac{r}{n}\right)^{nt} = ${P}\left(1 + \tfrac{${rate}}{${n}}\right)^{${n * t}} \approx \$${$(A)}\).`, ...(T === "interest" ? [R`Interest = \(A - P \approx \$${$(A - P)}\).`] : [])],
        rubric: ["Correct formula and values — 1", "Answer — 1"], hints: ["A = P(1 + r/n)^(nt), with r as a decimal.", "n is the number of compounding periods per year."] };
    },
  });

  B.family({
    id: "i_investments", unit: "I", sub: "I.investments", title: "Comparing investments", concepts: ["finance.interest"],
    kinds: ["mc", "nr"], modes: ["simple", "normal", "challenge"], answer: "choice / year", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["simple vs compound", "two compound offers", "read a technology table"],
    gen(r, mode, kind) {
      const P = K.pick(r, [1000, 2000, 2500, 4000, 5000]), t = K.int(r, 3, 12);
      if (kind === "nr") {
        // a table like a spreadsheet would show; answer: first year the balance exceeds the target
        const rate = K.pick(r, [3, 4, 5, 6, 7]) / 100, n = K.pick(r, [1, 12]);
        const rows = []; for (let y = 0; y <= 12; y++) rows.push([y, amount(P, rate, n, y)]);
        const target = Math.round(P * K.pick(r, [1.3, 1.4, 1.5, 1.6]));
        const first = rows.find((x) => x[1] >= target);
        if (!first) throw new Error("x");
        const table = `<table class="mini-table"><thead><tr><th>Year</th><th>Balance ($)</th></tr></thead><tbody>${rows.map(([y, v]) => `<tr><td>${y}</td><td>${$(v)}</td></tr>`).join("")}</tbody></table>`;
        return { kind: "nr", template: "read a technology table", sig: `tab|${P}|${rate}|${n}|${target}`, answer: first[0], ansText: String(first[0]), fmt: "Year",
          q: `A spreadsheet shows the balance of $${$(P)} invested at ${rate * 100}% compounded ${FREQ[n]}. In which year does the balance first reach $${$(target)}? ${table}`,
          e: `Scan down the table: year ${first[0] - 1} shows $${$(rows[first[0] - 1][1])}, year ${first[0]} shows $${$(first[1])}, the first at or above $${$(target)}.`, hints: ["Find the first row whose balance is at least the target."] };
      }
      const T = mode === "simple" ? "svc" : K.pick(r, ["two", "svc"]);
      if (T === "svc") {
        const rs = K.pick(r, [4, 5, 6]) / 100, rc = rs - K.pick(r, [0.5, 0.75, 1]) / 100;
        const S = P * (1 + rs * t), C = amount(P, rc, 1, t);
        const better = C > S ? "compound" : "simple";
        const opts = [`${better === "compound" ? `Compound interest at ${(rc * 100).toFixed(2)}%` : `Simple interest at ${(rs * 100).toFixed(2)}%`}, by about $${$(Math.abs(C - S))}`, `${better === "compound" ? `Simple interest at ${(rs * 100).toFixed(2)}%` : `Compound interest at ${(rc * 100).toFixed(2)}%`}, by about $${$(Math.abs(C - S))}`, "They are worth exactly the same", `${better === "compound" ? `Compound interest at ${(rc * 100).toFixed(2)}%` : `Simple interest at ${(rs * 100).toFixed(2)}%`}, by about $${$(Math.abs(C - S) * 2 + 10)}`];
        return { kind: "mc", c: opts, template: "simple vs compound", sig: `svc|${P}|${rs}|${rc}|${t}`,
          q: `Which earns more on $${$(P)} over ${t} years: simple interest at ${(rs * 100).toFixed(2)}% per year, or interest at ${(rc * 100).toFixed(2)}% per year compounded annually?`,
          e: `Simple: $${$(P)} × (1 + ${rs} × ${t}) = $${$(S)}. Compound: $${$(P)} × ${(1 + rc).toFixed(4)}^${t} = $${$(C)}. ${better === "compound" ? "Compounding wins" : "The higher simple rate wins over this time"} by $${$(Math.abs(C - S))}.`, hints: ["Simple: A = P(1 + rt). Compound: A = P(1 + r)^t."] };
      }
      const r1 = K.pick(r, [3.6, 4, 4.2, 4.5]) / 100, n1 = 1, r2 = r1 - K.pick(r, [0.1, 0.15, 0.2]) / 100, n2 = 12;
      const A1 = amount(P, r1, n1, t), A2 = amount(P, r2, n2, t);
      const win = A1 > A2 ? 1 : 2;
      const lab = (k) => (k === 1 ? `Offer A: ${(r1 * 100).toFixed(2)}% compounded annually` : `Offer B: ${(r2 * 100).toFixed(2)}% compounded monthly`);
      return { kind: "mc", c: [lab(win), lab(3 - win), "They grow to the same amount", "It depends on the principal"], template: "two compound offers", sig: `two|${P}|${r1}|${r2}|${t}`,
        q: `For a ${t}-year investment, which offer is better: A, ${(r1 * 100).toFixed(2)}% compounded annually, or B, ${(r2 * 100).toFixed(2)}% compounded monthly?`,
        e: `Compare growth factors: A gives ${Math.pow(1 + r1, t).toFixed(4)}, B gives ${Math.pow(1 + r2 / 12, 12 * t).toFixed(4)} over ${t} years. The principal multiplies both equally, so it doesn't change the answer.`, hints: ["Compare (1 + r)^t with (1 + r/12)^(12t)."] };
    },
  });

  B.family({
    id: "i_loans", unit: "I", sub: "I.loans", title: "Loans with regular payments", concepts: ["finance.loans"],
    kinds: ["wr"], modes: ["simple", "normal", "challenge"], answer: "dollars", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["monthly payment", "total interest paid", "compare two loan terms"],
    gen(r, mode) {
      const P = K.pick(r, mode === "simple" ? [2000, 3000, 5000] : [8000, 12000, 15000, 20000, 25000]);
      const rate = K.pick(r, [3.9, 4.5, 5.2, 6, 6.9, 7.5]) / 100, years = K.pick(r, mode === "simple" ? [1, 2] : [3, 4, 5]);
      const i = rate / 12, N = 12 * years;
      const M = pmt(P, i, N);
      const T = mode === "simple" ? "pay" : mode === "normal" ? K.pick(r, ["pay", "interest"]) : "compare";
      if (T === "compare") {
        const y2 = years + K.pick(r, [1, 2]), N2 = 12 * y2, M2 = pmt(P, i, N2);
        const extra = M2 * N2 - M * N;
        return { kind: "wr", template: "compare two loan terms", sig: `cmp|${P}|${rate}|${years}|${y2}`, title: "Loan terms",
          intro: R`A $${$(P)} car loan is at ${(rate * 100).toFixed(1)}% per year, compounded monthly, with monthly payments. Compare a ${years}-year term with a ${y2}-year term.`,
          parts: [
            { key: "a", label: "(a)", prompt: `Monthly payment over ${y2} years ($):`, kind: "approx", answer: M2, dp: 2, unit: "$", marks: 1 },
            { key: "b", label: "(b)", prompt: "How much more interest does the longer term cost ($)?", kind: "approx", answer: extra, dp: 2, unit: "$", marks: 2 },
          ],
          solution: [R`Payment: \(\dfrac{P\,i}{1 - (1 + i)^{-N}}\), \(i = \tfrac{${rate}}{12}\).`, R`${years} years: $${$(M)} × ${N} = $${$(M * N)}. ${y2} years: $${$(M2)} × ${N2} = $${$(M2 * N2)}.`, R`The longer term costs $${$(extra)} more in interest, even though each payment is smaller.`],
          rubric: ["Payment — 1", "Totals compared — 2"], hints: ["Work out each payment, multiply by the number of payments, then compare totals."] };
      }
      const parts = T === "interest"
        ? [{ key: "a", label: "(a)", prompt: "Monthly payment ($):", kind: "approx", answer: M, dp: 2, unit: "$", marks: 1 }, { key: "b", label: "(b)", prompt: "Total interest paid ($):", kind: "approx", answer: M * N - P, dp: 2, unit: "$", marks: 2 }]
        : [{ key: "a", label: "", prompt: "Monthly payment ($):", kind: "approx", answer: M, dp: 2, unit: "$", marks: 2, wrongs: [{ value: (P * (1 + rate * years)) / N, note: "That spreads simple interest evenly. Loan payments use the annuity formula: PMT = P·i / (1 − (1 + i)^−N)." }] }];
      return { kind: "wr", template: T === "interest" ? "total interest paid" : "monthly payment", sig: `${T}|${P}|${rate}|${years}`, title: "Loan payments",
        intro: R`A loan of $${$(P)} is repaid with equal monthly payments over ${years} year${years > 1 ? "s" : ""} at ${(rate * 100).toFixed(1)}% per year, compounded monthly.`,
        parts, solution: [R`\(i = \tfrac{${rate}}{12}\), \(N = ${N}\). \(\text{PMT} = \dfrac{${P}\,i}{1 - (1 + i)^{-${N}}} \approx \$${$(M)}\).`, ...(T === "interest" ? [R`Total paid: \(${N} \times ${$(M)} = \$${$(M * N)}\); interest = \(\$${$(M * N - P)}\).`] : [])],
        rubric: ["Rate per period and number of payments — 1", "Payment / interest — 1+"], hints: ["Use the monthly rate i = annual rate ÷ 12 and N = 12 × years.", "Total interest = (payment × number of payments) − amount borrowed."] };
    },
  });

  B.family({
    id: "i_lease", unit: "I", sub: "I.lease", title: "Buying versus leasing", concepts: ["finance.loans"],
    kinds: ["wr", "mc"], modes: ["simple", "normal", "challenge"], answer: "dollars / choice", complexity: { simple: 1, normal: 2, challenge: 3 },
    templates: ["total cost of a lease", "buy (cash, then resell) vs lease", "buy with a loan vs lease"],
    gen(r, mode, kind) {
      const price = K.pick(r, [18000, 22000, 26000, 30000, 34000]), months = K.pick(r, [36, 48]);
      const down = K.pick(r, [1000, 2000, 2500, 3000]), lease = K.pick(r, [249, 299, 329, 359, 399, 429]);
      const resale = Math.round(price * K.pick(r, [0.45, 0.5, 0.55, 0.6]) / 100) * 100;
      const leaseCost = down + lease * months;
      if (kind === "wr" && (mode === "simple" || (mode === "normal" && K.coin(r)))) {
        return { kind: "wr", template: "total cost of a lease", sig: `l|${down}|${lease}|${months}`, title: "Leasing", intro: R`A lease costs $${$(down)} down and $${lease} per month for ${months} months. What is the total cost of the lease?`,
          parts: [{ key: "a", label: "", prompt: "Total ($):", kind: "approx", answer: leaseCost, dp: 2, unit: "$", marks: 1 }],
          solution: [R`\(${$(down)} + ${lease} \times ${months} = \$${$(leaseCost)}\).`], rubric: ["Total — 1"], hints: ["Down payment plus all the monthly payments."] };
      }
      let buyCost, steps;
      if (mode === "challenge") {
        const rate = K.pick(r, [4.9, 5.9, 6.9]) / 100, M = pmt(price - down, rate / 12, months);
        buyCost = down + M * months - resale;
        steps = [R`Buy with a loan: payment on $${$(price - down)} at ${(rate * 100).toFixed(1)}% over ${months} months ≈ $${$(M)}/month.`, R`Net cost of buying: \(${$(down)} + ${$(M)} \times ${months} - ${$(resale)} \approx \$${$(buyCost)}\) (after selling the car).`];
      } else {
        buyCost = price - resale;
        steps = [R`Buy with cash and resell: \(${$(price)} - ${$(resale)} = \$${$(buyCost)}\).`];
      }
      steps.push(R`Lease: \(${$(down)} + ${lease} \times ${months} = \$${$(leaseCost)}\) (you return the car).`);
      const cheaper = buyCost < leaseCost ? "Buying" : "Leasing", diff = Math.abs(buyCost - leaseCost);
      if (kind === "mc") return { kind: "mc", c: [`${cheaper}, by about $${$(diff)}`, `${cheaper === "Buying" ? "Leasing" : "Buying"}, by about $${$(diff)}`, "They cost the same", `${cheaper}, by about $${$(diff + 1500)}`], template: mode === "challenge" ? "buy with a loan vs lease" : "buy (cash, then resell) vs lease", sig: `mc|${price}|${down}|${lease}|${months}|${resale}|${mode}`,
        q: `A $${$(price)} car can be bought${mode === "challenge" ? " with $" + $(down) + " down and a loan for the rest" : " with cash"} and sold for $${$(resale)} after ${months} months, or leased for $${$(down)} down and $${lease}/month for ${months} months. Which costs less overall?`,
        e: steps.join(" ") + ` ${cheaper} is cheaper by about $${$(diff)} — but leasing leaves you with no car at the end.`, hints: ["Compare the net cost of each: what you pay minus what you get back."] };
      return { kind: "wr", template: mode === "challenge" ? "buy with a loan vs lease" : "buy (cash, then resell) vs lease", sig: `wr|${price}|${down}|${lease}|${months}|${resale}|${mode}`, title: "Buy or lease?",
        intro: `A $${$(price)} car can be bought${mode === "challenge" ? ` with $${$(down)} down and a loan for the rest at the rate given in part (a)` : " with cash"} and sold for $${$(resale)} after ${months} months, or leased for $${$(down)} down and $${lease}/month for ${months} months.`.replace(" at the rate given in part (a)", ""),
        parts: [{ key: "a", label: "(a)", prompt: "Net cost of buying ($):", kind: "approx", answer: buyCost, dp: 2, unit: "$", marks: 1 }, { key: "b", label: "(b)", prompt: "Total cost of leasing ($):", kind: "approx", answer: leaseCost, dp: 2, unit: "$", marks: 1 }],
        solution: steps, rubric: ["Net buy cost — 1", "Lease cost — 1"], hints: ["Net cost of buying = everything you pay − what you sell it for.", "Lease cost = down payment + monthly payments."] };
    },
  });
})(typeof window !== "undefined" ? window : globalThis);
