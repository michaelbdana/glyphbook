import { useStore } from "./state/store";
import TopBar from "./components/TopBar";
import LibraryScreen from "./screens/LibraryScreen";
import WritingScreen from "./screens/WritingScreen";
import FormattingScreen from "./screens/FormattingScreen";

export default function App() {
  const screen = useStore((s) => s.screen);

  return (
    <div className="flex h-full flex-col bg-paper text-ink">
      <TopBar />
      <main className="min-h-0 flex-1">
        {screen === "library" && <LibraryScreen />}
        {screen === "writing" && <WritingScreen />}
        {screen === "formatting" && <FormattingScreen />}
      </main>
    </div>
  );
}
