/- Three examples from Xilin Chen's proof playground.
   The proofs use Lean core and were checked with Lean 4.34.1. -/

-- Swap a pair
example (P Q : Prop) (h : P ∧ Q) : Q ∧ P := by
  constructor
  · exact h.2
  · exact h.1

-- Follow an implication
example (P Q R : Prop) (f : P → Q) (g : Q → R) : P → R := by
  intro p
  apply g
  exact f p

-- Carry a bound
example (a b M : Nat) (same : b = a) (bound : a ≤ M) : b ≤ M := by
  rw [same]
  exact bound
