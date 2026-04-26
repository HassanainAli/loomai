import { useState } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { PrimaryButton } from "../Shell";

const GENDER = ["Man", "Woman", "Non-Binary"] as const;
const SEEKING = ["Men", "Women", "Everyone"] as const;

export function IdentitySpec({
  initialName,
  initialGender,
  initialSeeking,
  onNext,
  onBack,
}: {
  initialName: string;
  initialGender: string;
  initialSeeking: string;
  onNext: (data: { name: string; gender: string; seeking: string }) => void;
  onBack: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [gender, setGender] = useState(initialGender);
  const [seeking, setSeeking] = useState(initialSeeking);

  const ready = name.trim().length > 0 && gender && seeking;

  return (
    <div className="flex flex-col h-full p-8 pt-8 overflow-y-auto">
      <button
        onClick={onBack}
        className="-ml-2 mb-4 p-2 w-9 text-foreground/70 hover:text-foreground transition-colors"
        aria-label="Back"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
        Step 1 of 5
      </p>
      <h2 className="text-3xl font-black tracking-tight mb-1">
        Identity Spec.
      </h2>
      <p className="text-sm text-muted-foreground mb-8">
        Three high-clarity fields. The engine starts here.
      </p>

      <div className="space-y-5">
        <Field label="Name Spec" hint="Identification">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your first name"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#FACC15] transition-colors"
          />
        </Field>

        <Field label="Gender Spec" hint="Identity Spectrum">
          <SelectChips
            options={[...GENDER]}
            value={gender}
            onChange={setGender}
          />
        </Field>

        <Field label="Seeking" hint="Target Frequency">
          <SelectChips
            options={[...SEEKING]}
            value={seeking}
            onChange={setSeeking}
          />
        </Field>
      </div>

      <div className="flex-1 min-h-8" />
      <PrimaryButton
        onClick={() => onNext({ name: name.trim(), gender, seeking })}
        disabled={!ready}
      >
        Next
      </PrimaryButton>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-[#FACC15]">
          {label}
        </label>
        <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono">
          {hint}
        </span>
      </div>
      {children}
    </div>
  );
}

function SelectChips({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`text-xs font-bold py-3 rounded-xl border-2 transition-all ${
              active
                ? "border-[#FACC15] bg-[#FACC15]/10 text-[#FACC15] shadow-[0_0_18px_-4px_rgba(250,204,21,0.6)]"
                : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
