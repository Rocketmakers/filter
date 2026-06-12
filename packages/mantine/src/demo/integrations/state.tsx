import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type WizardState = Record<string, string>;

type IntegrationsStateValue = {
  wizardState: WizardState;
  selectedExamples: Record<string, string | null>;
  perTileToggles: Record<string, Record<string, string>>;
  setWizardState: React.Dispatch<React.SetStateAction<WizardState>>;
  setSelectedExamples: React.Dispatch<
    React.SetStateAction<Record<string, string | null>>
  >;
  setPerTileToggles: React.Dispatch<
    React.SetStateAction<Record<string, Record<string, string>>>
  >;
};

const IntegrationsStateContext =
  createContext<IntegrationsStateValue | null>(null);

export function IntegrationsStateProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [wizardState, setWizardState] = useState<WizardState>({});
  const [selectedExamples, setSelectedExamples] = useState<
    Record<string, string | null>
  >({});
  const [perTileToggles, setPerTileToggles] = useState<
    Record<string, Record<string, string>>
  >({});

  const value = useMemo<IntegrationsStateValue>(
    () => ({
      wizardState,
      selectedExamples,
      perTileToggles,
      setWizardState,
      setSelectedExamples,
      setPerTileToggles,
    }),
    [wizardState, selectedExamples, perTileToggles],
  );

  return (
    <IntegrationsStateContext.Provider value={value}>
      {children}
    </IntegrationsStateContext.Provider>
  );
}

export function useIntegrationsState(): IntegrationsStateValue {
  const ctx = useContext(IntegrationsStateContext);
  if (!ctx) {
    throw new Error(
      "useIntegrationsState must be used inside <IntegrationsStateProvider>",
    );
  }
  return ctx;
}
