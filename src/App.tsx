import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { SettingsProvider, useSettings } from "./context/SettingsContext";
import { ToastProvider } from "./context/ToastContext";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import LearnPicker from "./pages/LearnPicker";
import LearnSession from "./pages/LearnSession";
import Library from "./pages/Library";
import DeckDetail from "./pages/DeckDetail";
import DeckForm from "./pages/DeckForm";
import CardForm from "./pages/CardForm";
import Favorites from "./pages/Favorites";
import Statistics from "./pages/Statistics";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Import from "./pages/Import";

function AppRoutes() {
  const { settings, loading } = useSettings();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
        <div className="h-10 w-10 animate-pulse rounded-2xl bg-lavender-500" />
      </div>
    );
  }

  if (!settings.onboardingComplete) {
    return <Onboarding />;
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/learn" element={<LearnPicker />} />
      <Route path="/learn/:deckId" element={<LearnSession />} />
      <Route path="/library" element={<Library />} />
      <Route path="/favorites" element={<Favorites />} />
      <Route path="/deck/:deckId" element={<DeckDetail />} />
      <Route path="/createDeck" element={<DeckForm mode="create" />} />
      <Route path="/editDeck/:deckId" element={<DeckForm mode="edit" />} />
      <Route path="/createCard/:deckId" element={<CardForm mode="create" />} />
      <Route path="/editCard/:cardId" element={<CardForm mode="edit" />} />
      <Route path="/stats" element={<Statistics />} />
      <Route path="/history" element={<History />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/import" element={<Import />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <SettingsProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </SettingsProvider>
    </ToastProvider>
  );
}
