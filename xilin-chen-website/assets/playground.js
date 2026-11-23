(() => {
  const lab = document.querySelector("#proof-lab");
  if (!lab) return;
  const pick = lab.querySelector("#challenge");
  const goalBox = lab.querySelector("#goals");
  const choices = lab.querySelector("#choices");
  const feedback = lab.querySelector("#feedback");
  const hint = lab.querySelector("#hint-text");
  const hintButton = lab.querySelector("#hint");
  const undo = lab.querySelector("#undo");
  const next = lab.querySelector("#next-challenge");
  const source = lab.querySelector("#proof-source");
  const prompts = [
    {
      name: "Swap a pair",
      statement: "example (P Q : Prop) (h : P ∧ Q) : Q ∧ P := by",
      context: "P Q : Prop\nh : P ∧ Q",
      insight: "The two projections of h supply the same facts in the opposite order.",
      steps: [
        {goals:["Q ∧ P"], correct:"constructor", line:"  constructor",
          hint:"A proof of a conjunction needs one proof for each side.",
          options:[["exact h","h supplies P ∧ Q. The target asks for Q ∧ P."],["constructor"],["intro p","The target is a conjunction. An implication would let you introduce a hypothesis."]]},
        {goals:["Q","P"], correct:"exact h.2", line:"  · exact h.2",
          hint:"The second projection of h has type Q.",
          options:[["exact h.1","The first projection has type P. The first open goal is Q."],["exact h","h has a conjunction as its type. This goal asks for its second component."],["exact h.2"]]},
        {goals:["P"], correct:"exact h.1", line:"  · exact h.1",
          hint:"Read the first component of the original pair.",
          options:[["exact h.1"],["exact h.2","h.2 supplies Q. The remaining goal is P."],["exact h","h proves both propositions together. Select its P component."]]}
      ]
    },
    {
      name:"Follow an implication",
      statement:"example (P Q R : Prop) (f : P → Q) (g : Q → R) : P → R := by",
      context:"P Q R : Prop\nf : P → Q\ng : Q → R",
      insight:"The proof sends an input through f and then through g.",
      steps:[
        {goals:["P → R"],correct:"intro p",line:"  intro p",
          hint:"Assume the premise of the implication.",
          options:[["intro p"],["exact g","g expects a proof of Q. This implication begins with P."],["exact f","f finishes with Q. This implication must finish with R."]]},
        {goals:["R"],extra:"p : P",correct:"apply g",line:"  apply g",
          hint:"Look for an implication whose conclusion matches R.",
          options:[["exact p","p has type P. The goal is R."],["apply g"],["apply f","The conclusion of f is Q. It cannot match this goal."]]},
        {goals:["Q"],extra:"p : P",correct:"exact f p",line:"  exact f p",
          hint:"Feed the available proof of P to f.",
          options:[["exact p","p proves the premise P. You need Q."],["exact g","g is an implication from Q to R. Here a proof of Q is needed."],["exact f p"]]}
      ]
    },
    {
      name:"Carry a bound",
      statement:"example (a b M : Nat) (same : b = a) (bound : a ≤ M) : b ≤ M := by",
      context:"a b M : Nat\nsame : b = a\nbound : a ≤ M",
      insight:"Once the quantities agree, the bound on a also bounds b.",
      steps:[
        {goals:["b ≤ M"],correct:"rw [same]",line:"  rw [same]",
          hint:"An equality lets you replace b by a in the goal.",
          options:[["exact bound","bound is about a. The goal still mentions b."],["exact same","same proves an equality. The target is an inequality."],["rw [same]"]]},
        {goals:["a ≤ M"],correct:"exact bound",line:"  exact bound",
          hint:"One hypothesis now has exactly the target type.",
          options:[["exact same","same has type b = a. Look for the inequality in the context."],["exact bound"],["rfl","Reflexivity would show a ≤ a. Here M is an independent variable."]]}
      ]
    }
  ];
  let index = 0;
  let solved = 0;

  function setFeedback(message, kind) {
    feedback.className = "response " + (kind || "");
    feedback.textContent = message;
  }
  function clearHint() {
    hint.hidden = true;
    hintButton.setAttribute("aria-expanded","false");
    hintButton.textContent = "Show hint";
  }
  function update(focusChoice) {
    const puzzle = prompts[index];
    const step = puzzle.steps[solved];
    const complete = !step;
    lab.classList.toggle("solved", complete);
    lab.querySelector("#progress").textContent = complete ? "Proof complete" : "Step " + (solved+1) + " of " + puzzle.steps.length;
    lab.querySelector("#context").textContent = puzzle.context + (step?.extra ? "\n" + step.extra : "");
    lab.querySelector("#state-title").textContent = complete ? "No goals" : "Proof state";
    goalBox.replaceChildren();
    (step?.goals || []).forEach((g,i) => {
      const line = document.createElement("div");
      line.className = i ? "later-goal" : "current-goal";
      const sr = document.createElement("span");
      sr.className = "sr-only";
      sr.textContent = i ? "Remaining goal " : "Current goal ";
      line.append(sr, "⊢ " + g);
      goalBox.append(line);
    });
    const written = puzzle.steps.slice(0,solved).map(s=>s.line);
    source.textContent = [puzzle.statement, ...written, ...(complete ? [] : ["  -- choose the next step"])].join("\n");
    lab.querySelector("#choice-title").textContent = complete ? "Proof finished." : "Choose a tactic";
    choices.replaceChildren();
    if (step) {
      for (const [command, message] of step.options) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = command;
        button.className = "tactic";
        button.addEventListener("click", () => {
          if (command !== step.correct) {
            setFeedback(message, "retry");
            return;
          }
          solved++;
          update(true);
          setFeedback(solved === puzzle.steps.length ? "No goals left. " + puzzle.insight : command + " applied. Next goal: " + puzzle.steps[solved].goals[0] + ".", "success");
        });
        choices.append(button);
      }
      hint.textContent = step.hint;
    }
    clearHint();
    hintButton.hidden = complete;
    next.hidden = !complete;
    undo.disabled = solved === 0;
    if (focusChoice) (complete ? next : choices.querySelector("button")).focus({preventScroll:true});
  }
  function selectPuzzle(i) {
    index = i;
    pick.value = String(i);
    solved = 0;
    setFeedback("");
    update(false);
  }
  prompts.forEach((p,i) => pick.add(new Option(p.name, i)));
  pick.addEventListener("change", () => selectPuzzle(Number(pick.value)));
  next.addEventListener("click", () => { selectPuzzle((index+1)%prompts.length); choices.querySelector("button").focus({preventScroll:true}); });
  undo.addEventListener("click", () => { if (solved) solved--; setFeedback("Last step undone."); update(true); });
  hintButton.addEventListener("click", () => {
    hint.hidden = !hint.hidden;
    hintButton.setAttribute("aria-expanded",String(!hint.hidden));
    hintButton.textContent = hint.hidden ? "Show hint" : "Hide hint";
  });
  const route = () => selectPuzzle(({"#pair":0,"#implication":1,"#bound":2})[location.hash] ?? 0);
  route();
  window.addEventListener("hashchange", route);
  lab.hidden = false;
})();
